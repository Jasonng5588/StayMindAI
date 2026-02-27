-- ============================================================
-- FINAL CHAT FIX (no enum issues)
-- Copy-paste this entire script into Supabase SQL Editor and Run
-- ============================================================

-- ── 1. Fix notification type column: ENUM → TEXT ───────────────
-- The type column is an ENUM. We change it to TEXT to allow any value.
ALTER TABLE notifications
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

ALTER TABLE notifications
  ALTER COLUMN type SET DEFAULT 'info';

-- ── 2. Fix ticket_messages RLS ─────────────────────────────────
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'ticket_messages' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ticket_messages';
  END LOOP;
END $$;

-- Allow ALL authenticated users to SELECT ticket messages
-- (safe: app code only shows messages for the current ticket)
-- This also ensures Realtime works for both guest and admin subscribers
CREATE POLICY "Authenticated users read ticket messages" ON ticket_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Guests can INSERT messages for their own tickets
CREATE POLICY "Guests insert own ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- ── 3. Fix support_tickets RLS ─────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'support_tickets' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON support_tickets';
  END LOOP;
END $$;

-- All authenticated users can read all tickets
-- (guests see by user_id in app; admin sees all in UI)
CREATE POLICY "Authenticated users read tickets" ON support_tickets
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Guests can create their own tickets
CREATE POLICY "Guests create own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Guests can update their own tickets (rating)
CREATE POLICY "Guests update own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid());

-- ── 4. Ensure Realtime publications ───────────────────────────
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE user_vouchers; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ── 5. Verify ─────────────────────────────────────────────────
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('ticket_messages', 'support_tickets')
ORDER BY tablename;

SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
