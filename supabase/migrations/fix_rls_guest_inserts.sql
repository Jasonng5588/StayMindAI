-- ============================================================
-- EMERGENCY FIX: RLS INSERT policies + guest permissions
-- Safe to re-run (idempotent)
-- ============================================================

-- ============================================================
-- 1. BOOKINGS — Add INSERT policy for authenticated guests
-- ============================================================
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
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 2. SUPPORT TICKETS — Ensure guest INSERT + SELECT policies
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own tickets" ON support_tickets;
  CREATE POLICY "Users manage own tickets" ON support_tickets
    FOR ALL USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
  CREATE POLICY "Users create tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 3. TICKET MESSAGES — Ensure guest INSERT policy
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Ticket participants send messages" ON ticket_messages;
  CREATE POLICY "Ticket participants send messages" ON ticket_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

  DROP POLICY IF EXISTS "Ticket participants view messages" ON ticket_messages;
  CREATE POLICY "Ticket participants view messages" ON ticket_messages
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
      OR sender_id = auth.uid()
    );
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 4. LOYALTY POINTS — Add guest INSERT policy
--    (guests must be able to insert redemption records)
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own loyalty points" ON loyalty_points;
  CREATE POLICY "Users view own loyalty points" ON loyalty_points
    FOR SELECT USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users insert own loyalty points" ON loyalty_points;
  CREATE POLICY "Users insert own loyalty points" ON loyalty_points
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 5. REVIEWS — Add guest INSERT policy (using guest_id column)
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Guests manage own reviews" ON reviews;
  CREATE POLICY "Guests manage own reviews" ON reviews
    FOR ALL USING (guest_id = auth.uid());

  DROP POLICY IF EXISTS "Guests insert reviews" ON reviews;
  CREATE POLICY "Guests insert reviews" ON reviews
    FOR INSERT WITH CHECK (guest_id = auth.uid());
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 6. Add nullable hotel_id to loyalty_points if table exists
--    with hotel_id as NOT NULL — make it nullable for guest use
-- ============================================================
DO $$
BEGIN
  ALTER TABLE loyalty_points ALTER COLUMN hotel_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 7. Add 'source' column to bookings if missing
-- ============================================================
DO $$
BEGIN
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'mobile_app';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 8. Add 'room_type' column to bookings if missing
-- ============================================================
DO $$
BEGIN
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_type TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
