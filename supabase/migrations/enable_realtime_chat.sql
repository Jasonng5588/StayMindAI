-- ============================================================
-- Enable Supabase Realtime on ticket_messages and support_tickets
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable Realtime on ticket_messages (required for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;

-- Enable Realtime on support_tickets (for ticket status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;

-- Confirm
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('ticket_messages', 'support_tickets');
