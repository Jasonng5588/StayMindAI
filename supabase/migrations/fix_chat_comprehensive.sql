-- ============================================================
-- COMPREHENSIVE LIVE CHAT + NOTIFICATIONS FIX
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Fix notification type: change ENUM to TEXT ─────────────
-- The column 'type' uses an enum that doesn't contain 'voucher'
-- Simplest fix: change to TEXT with a check constraint instead

-- First check what the column type is
DO $$ BEGIN
  -- Try to alter the enum if it exists
  BEGIN
    EXECUTE 'ALTER TYPE notification_type ADD VALUE IF NOT EXISTS ''voucher''';
  EXCEPTION WHEN others THEN
    -- Enum doesn't exist or can't be modified, try changing column to TEXT
    NULL;
  END;
END $$;

-- Force convert the type column to TEXT regardless (safest approach)
ALTER TABLE notifications
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- Update the default
ALTER TABLE notifications
  ALTER COLUMN type SET DEFAULT 'info';

-- ── 2. Fix ticket_messages RLS for Realtime (NO FILTER approach) ──
-- KEY INSIGHT: Supabase Realtime postgres_changes with row-level filters
-- only works if the subscriber JWT has SELECT access to those rows via RLS.
-- Since both admin and guest users need to receive messages, and they
-- have different RLS contexts, we use NO FILTER on subscriptions and
-- filter client-side instead. This requires: all needed clients can SELECT.

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users select own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users insert guest messages" ON ticket_messages;
DROP POLICY IF EXISTS "Service role all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Guests view own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Guests can view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Anyone view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Guests insert own messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users insert messages" ON ticket_messages;
DROP POLICY IF EXISTS "Service role all" ON ticket_messages;
DROP POLICY IF EXISTS "Admins view all ticket messages" ON ticket_messages;

-- Guest users can SELECT their own ticket messages (for Realtime)
CREATE POLICY "Guest select own ticket messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Staff/admin users with role='staff' or 'admin' in profiles can see all
CREATE POLICY "Staff select all ticket messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- Guests can INSERT messages for their own tickets
CREATE POLICY "Guest insert own ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    role = 'guest' AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS (admin API inserts)
-- This is automatic for service_role, no policy needed

-- ── 3. Fix support_tickets RLS ─────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users insert own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Service role all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Guests view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Guests update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Guests insert own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff select all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins select all tickets" ON support_tickets;

-- Guests see their own tickets
CREATE POLICY "Guest select own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

-- Guests can create tickets
CREATE POLICY "Guest insert own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Guests can update their own tickets (for rating)
CREATE POLICY "Guest update own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid());

-- Staff/admin can see ALL tickets (needed for admin support page)
CREATE POLICY "Staff select all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- ── 4. Ensure Realtime publications are set ────────────────────
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── 5. Verify ──────────────────────────────────────────────────
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('ticket_messages', 'support_tickets', 'notifications')
ORDER BY tablename, cmd;

SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('ticket_messages', 'support_tickets', 'notifications');
