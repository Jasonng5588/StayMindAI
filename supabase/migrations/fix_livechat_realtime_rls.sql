-- ============================================================
-- Fix ticket_messages RLS for Realtime + Fix live chat reception
-- CRITICAL: Supabase Realtime postgres_changes with row-filter
-- requires the subscribed user to have SELECT RLS access to that row.
-- Without this, filtered subscriptions silently receive nothing.
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Enable Realtime publications (if not already done) ──────
DO $$ BEGIN
  -- Add ticket_messages to realtime if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  -- Add support_tickets to realtime if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── 2. Ensure ticket_messages has RLS enabled ──────────────────
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies
DROP POLICY IF EXISTS "Guests view own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Guests can view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Anyone view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Guests insert own messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users insert messages" ON ticket_messages;
DROP POLICY IF EXISTS "Service role all" ON ticket_messages;

-- Guests can SELECT messages for tickets they own
-- (CRITICAL for Realtime filter `ticket_id=eq.X` to work!)
CREATE POLICY "Users select own ticket messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Guests can INSERT their own messages (role = 'guest')
CREATE POLICY "Users insert guest messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    role = 'guest' AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Service role (admin API) can do everything
CREATE POLICY "Service role all ticket messages" ON ticket_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ── 3. Also fix support_tickets RLS for Realtime updates ───────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Guests update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Guests insert own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Service role all tickets" ON support_tickets;

CREATE POLICY "Users select own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role all tickets" ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- ── 4. Confirm publications ─────────────────────────────────────
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('ticket_messages', 'support_tickets', 'notifications', 'user_vouchers');
