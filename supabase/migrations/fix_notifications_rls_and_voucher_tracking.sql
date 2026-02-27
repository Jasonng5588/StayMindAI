-- ============================================================
-- Fix Voucher Notification Issues + Booking QR
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Fix notifications RLS so admin service_role can always insert ──
-- The existing policy "Users manage own notifications" FOR ALL blocks service_role
-- Solution: drop the FOR ALL and replace with specific per-action policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
  DROP POLICY IF EXISTS "Admins insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Users select own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
  DROP POLICY IF EXISTS "Service role all notifications" ON notifications;

  -- Users can read their own notifications
  CREATE POLICY "Users select own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

  -- Users can update their own (mark read)
  CREATE POLICY "Users update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

  -- Users can delete their own
  CREATE POLICY "Users delete own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

  -- Anyone (including service_role + admin client) can insert
  CREATE POLICY "Anyone can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
END $$;

-- ── 2. Fix user_vouchers RLS so admin service_role can insert vouchers ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage user vouchers" ON user_vouchers;
  DROP POLICY IF EXISTS "Users view own vouchers" ON user_vouchers;
  DROP POLICY IF EXISTS "Users update own vouchers" ON user_vouchers;
  DROP POLICY IF EXISTS "Anyone insert user vouchers" ON user_vouchers;

  CREATE POLICY "Users view own vouchers" ON user_vouchers FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "Users update own vouchers" ON user_vouchers FOR UPDATE USING (user_id = auth.uid());
  CREATE POLICY "Anyone insert user vouchers" ON user_vouchers FOR INSERT WITH CHECK (true);
  CREATE POLICY "Service role delete user vouchers" ON user_vouchers FOR DELETE USING (true);
END $$;

-- ── 3. Trigger: mark user_voucher as used + increment promo used_count when booking uses it ──
CREATE OR REPLACE FUNCTION handle_booking_voucher()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If booking has a voucher_code, mark the user_voucher as used
  IF NEW.voucher_code IS NOT NULL AND NEW.voucher_code != '' THEN
    -- Try to mark personal user_voucher as used
    UPDATE user_vouchers
    SET is_used = true, used_at = now(), booking_id = NEW.id
    WHERE user_id = NEW.user_id
      AND code = NEW.voucher_code
      AND is_used = false
    LIMIT 1;

    -- Increment promo_codes used_count
    UPDATE promo_codes
    SET used_count = used_count + 1
    WHERE code = NEW.voucher_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_with_voucher ON bookings;
CREATE TRIGGER on_booking_with_voucher
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.voucher_code IS NOT NULL)
  EXECUTE FUNCTION handle_booking_voucher();

-- ── 4. Confirm ──
SELECT 'Fix applied!' as status;
SELECT count(*) as notification_policies FROM pg_policies WHERE tablename = 'notifications';
