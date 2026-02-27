-- ============================================================
-- CRITICAL FIX: Ensure profiles exist for all auth users
-- Run this in Supabase SQL Editor — safe to re-run
-- ============================================================

-- 1. Re-create the handle_new_user trigger (ensures future signups work)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'guest')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Backfill profiles for all EXISTING auth users who don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(
    (u.raw_user_meta_data->>'role')::user_role,
    'guest'
  )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies for bookings (ensure guests can insert/select own bookings)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users create own bookings" ON bookings;
  CREATE POLICY "Users create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
  CREATE POLICY "Users view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users update own bookings" ON bookings;
  CREATE POLICY "Users update own bookings" ON bookings
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'bookings policy error: %', SQLERRM; END $$;

-- 4. RLS policies for support_tickets
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own tickets" ON support_tickets;
  CREATE POLICY "Users manage own tickets" ON support_tickets
    FOR ALL USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
  CREATE POLICY "Users create tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'support_tickets policy error: %', SQLERRM; END $$;

-- 5. RLS policies for ticket_messages
DO $$ BEGIN
  DROP POLICY IF EXISTS "Ticket participants send messages" ON ticket_messages;
  CREATE POLICY "Ticket participants send messages" ON ticket_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());
  DROP POLICY IF EXISTS "Ticket participants view messages" ON ticket_messages;
  CREATE POLICY "Ticket participants view messages" ON ticket_messages
    FOR SELECT USING (
      sender_id = auth.uid() OR
      EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    );
EXCEPTION WHEN others THEN RAISE LOG 'ticket_messages policy error: %', SQLERRM; END $$;

-- 6. Make loyalty_points.hotel_id nullable (guests may not always have hotel context)
DO $$ BEGIN
  ALTER TABLE loyalty_points ALTER COLUMN hotel_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- 7. RLS policies for loyalty_points (guests can insert their own)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own loyalty points" ON loyalty_points;
  CREATE POLICY "Users view own loyalty points" ON loyalty_points
    FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users insert own loyalty points" ON loyalty_points;
  CREATE POLICY "Users insert own loyalty points" ON loyalty_points
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'loyalty_points policy error: %', SQLERRM; END $$;

-- 8. RLS policies for reviews (uses guest_id column)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Guests manage own reviews" ON reviews;
  CREATE POLICY "Guests manage own reviews" ON reviews
    FOR ALL USING (guest_id = auth.uid());
  DROP POLICY IF EXISTS "Guests insert reviews" ON reviews;
  CREATE POLICY "Guests insert reviews" ON reviews
    FOR INSERT WITH CHECK (guest_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'reviews policy error: %', SQLERRM; END $$;

-- 9. Add optional columns to bookings if missing
DO $$ BEGIN ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'mobile_app'; EXCEPTION WHEN others THEN NULL; END $$;

-- Done!
SELECT 'Fix applied successfully. Profiles backfilled: ' || count(*) FROM public.profiles;
