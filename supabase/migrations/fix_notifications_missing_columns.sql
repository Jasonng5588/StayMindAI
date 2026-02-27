-- ============================================================
-- Fix notifications table: add missing columns
-- Run in Supabase SQL Editor
-- ============================================================

-- Add missing columns to notifications table
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Refresh PostgREST schema cache so new columns are recognized immediately
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
