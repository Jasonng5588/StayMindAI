-- ============================================================
-- Vouchers + Notifications + Realtime
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Ensure promo_codes table exists ────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_booking_amount NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage promo codes" ON promo_codes;
  CREATE POLICY "Admins manage promo codes" ON promo_codes FOR ALL USING (true);
  DROP POLICY IF EXISTS "Guests view active promo codes" ON promo_codes;
  CREATE POLICY "Guests view active promo codes" ON promo_codes FOR SELECT USING (is_active = true);
END $$;

-- ── 2. User Vouchers (personal vouchers assigned to specific users) ──
CREATE TABLE IF NOT EXISTS user_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  code TEXT NOT NULL, -- snapshot of code at time of assignment
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  booking_id UUID, -- will be set when used in a booking
  expires_at TIMESTAMPTZ,
  description TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user ON user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_code ON user_vouchers(user_id, code);

ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own vouchers" ON user_vouchers;
  CREATE POLICY "Users view own vouchers" ON user_vouchers FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Users update own vouchers" ON user_vouchers;
  CREATE POLICY "Users update own vouchers" ON user_vouchers FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Admins manage user vouchers" ON user_vouchers;
  CREATE POLICY "Admins manage user vouchers" ON user_vouchers FOR ALL USING (true);
END $$;

-- ── 3. Notifications table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info', -- 'info' | 'booking' | 'support' | 'loyalty' | 'voucher' | 'reward'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT, -- deep link or route
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
  CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Admins insert notifications" ON notifications;
  CREATE POLICY "Admins insert notifications" ON notifications FOR INSERT WITH CHECK (true);
END $$;

-- ── 4. Add rating column to support_tickets if missing ─────────
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS review_text TEXT;

-- ── 5. Add voucher_code + discount_amount to bookings ───────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voucher_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- ── 6. Enable Realtime on notifications ────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_vouchers;

-- ── 7. Trigger: auto-notify when ticket_message is inserted (admin reply) ──
CREATE OR REPLACE FUNCTION notify_on_ticket_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ticket RECORD;
BEGIN
  -- Only notify for admin replies
  IF NEW.role = 'admin' THEN
    SELECT * INTO ticket FROM support_tickets WHERE id = NEW.ticket_id;
    IF FOUND AND ticket.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        ticket.user_id,
        'support',
        'Support Agent Replied',
        LEFT(NEW.message, 120),
        jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ticket_message_inserted ON ticket_messages;
CREATE TRIGGER on_ticket_message_inserted
  AFTER INSERT ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_ticket_reply();

-- ── 8. Trigger: auto-notify when user_voucher assigned ─────────
CREATE OR REPLACE FUNCTION notify_on_voucher_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'voucher',
    '🎟️ You have a new voucher!',
    COALESCE(NEW.description, 'You received a ' || 
      CASE NEW.discount_type WHEN 'percentage' THEN NEW.discount_value::text || '% off' 
      ELSE 'RM' || NEW.discount_value::text || ' off' END || 
      ' voucher. Use code: ' || NEW.code),
    jsonb_build_object('voucher_id', NEW.id, 'code', NEW.code)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_voucher_inserted ON user_vouchers;
CREATE TRIGGER on_user_voucher_inserted
  AFTER INSERT ON user_vouchers
  FOR EACH ROW EXECUTE FUNCTION notify_on_voucher_assigned();

-- ── 9. Trigger: auto-notify when loyalty_points redeemed ───────
CREATE OR REPLACE FUNCTION notify_on_loyalty_redemption()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.type = 'redemption' THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'reward',
      '🎁 Reward Redeemed!',
      COALESCE(NEW.description, 'You redeemed ' || ABS(NEW.points)::text || ' points for a reward.'),
      jsonb_build_object('points_id', NEW.id, 'points', NEW.points)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_loyalty_points_inserted ON loyalty_points;
CREATE TRIGGER on_loyalty_points_inserted
  AFTER INSERT ON loyalty_points
  FOR EACH ROW EXECUTE FUNCTION notify_on_loyalty_redemption();

-- Confirm
SELECT 'Setup complete!' as status;
SELECT count(*) as notification_count FROM notifications;
