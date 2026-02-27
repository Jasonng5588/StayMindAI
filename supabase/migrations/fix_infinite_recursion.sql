-- ============================================================
-- DEFINITIVE FIX: Remove infinite recursion from profiles RLS
-- The "Admins read/update all profiles" policies query the profiles
-- table itself to check if the current user is an admin — this is
-- recursive. Replace with auth.jwt() which is non-recursive.
-- Run this in Supabase SQL Editor — safe to re-run.
-- ============================================================

-- Step 1: Temporarily disable RLS on profiles to clear all policies safely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop EVERY policy on profiles (clean slate)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create clean, NON-RECURSIVE policies
-- Users can read/write their OWN profile — direct uid check, no subquery
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins: use auth.jwt() NOT a subquery to profiles (avoids infinite recursion)
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'super_admin'
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- Step 5: Backfill profiles for any existing auth users who still don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'guest'::user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Fix handle_new_user trigger (ensure future signups auto-create profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'guest'::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 7: Fix bookings RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users create own bookings" ON bookings;
  CREATE POLICY "Users create own bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
  CREATE POLICY "Users view own bookings" ON bookings FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users update own bookings" ON bookings;
  CREATE POLICY "Users update own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'bookings RLS: %', SQLERRM; END $$;

-- Step 8: Fix support_tickets RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own tickets" ON support_tickets;
  CREATE POLICY "Users manage own tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
  CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'support_tickets RLS: %', SQLERRM; END $$;

-- Step 9: Fix ticket_messages RLS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Ticket participants send messages" ON ticket_messages;
  CREATE POLICY "Ticket participants send messages" ON ticket_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
  DROP POLICY IF EXISTS "Ticket participants view messages" ON ticket_messages;
  CREATE POLICY "Ticket participants view messages" ON ticket_messages FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );
EXCEPTION WHEN others THEN RAISE LOG 'ticket_messages RLS: %', SQLERRM; END $$;

-- Step 10: Fix loyalty_points (make hotel_id nullable, add insert policy)
DO $$ BEGIN ALTER TABLE loyalty_points ALTER COLUMN hotel_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own loyalty points" ON loyalty_points;
  CREATE POLICY "Users view own loyalty points" ON loyalty_points FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users insert own loyalty points" ON loyalty_points;
  CREATE POLICY "Users insert own loyalty points" ON loyalty_points FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'loyalty_points RLS: %', SQLERRM; END $$;

-- Step 11: Fix reviews RLS (table uses guest_id not user_id)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Guests manage own reviews" ON reviews;
  CREATE POLICY "Guests manage own reviews" ON reviews FOR ALL USING (guest_id = auth.uid());
  DROP POLICY IF EXISTS "Guests insert reviews" ON reviews;
  CREATE POLICY "Guests insert reviews" ON reviews FOR INSERT WITH CHECK (guest_id = auth.uid());
EXCEPTION WHEN others THEN RAISE LOG 'reviews RLS: %', SQLERRM; END $$;

-- Verify
SELECT 'Done. Profiles in DB: ' || count(*) FROM public.profiles;
SELECT 'Auth users without profile: ' || count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
