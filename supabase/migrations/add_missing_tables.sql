-- ============================================================
-- Migration: Add Missing Tables (idempotent — safe to re-run)
-- ============================================================

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_hotel ON banners(hotel_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active) WHERE is_active = true;

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Hotel team manages banners" ON banners;
  CREATE POLICY "Hotel team manages banners" ON banners FOR ALL USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = banners.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
  DROP POLICY IF EXISTS "Public views active banners" ON banners;
  CREATE POLICY "Public views active banners" ON banners FOR SELECT USING (is_active = true);
END $$;

-- ============================================================
-- LOYALTY TIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  benefits TEXT[] DEFAULT '{}',
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_hotel ON loyalty_tiers(hotel_id);

ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Hotel team manages loyalty tiers" ON loyalty_tiers;
  CREATE POLICY "Hotel team manages loyalty tiers" ON loyalty_tiers FOR ALL USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = loyalty_tiers.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
  DROP POLICY IF EXISTS "Public views loyalty tiers" ON loyalty_tiers;
  CREATE POLICY "Public views loyalty tiers" ON loyalty_tiers FOR SELECT USING (true);
END $$;

-- ============================================================
-- LOYALTY REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  stock INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_hotel ON loyalty_rewards(hotel_id);

ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Hotel team manages loyalty rewards" ON loyalty_rewards;
  CREATE POLICY "Hotel team manages loyalty rewards" ON loyalty_rewards FOR ALL USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = loyalty_rewards.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
  DROP POLICY IF EXISTS "Public views active rewards" ON loyalty_rewards;
  CREATE POLICY "Public views active rewards" ON loyalty_rewards FOR SELECT USING (is_active = true);
END $$;

-- ============================================================
-- LOYALTY POINTS (transaction log)
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'earned',
  description TEXT,
  reward_id UUID REFERENCES loyalty_rewards(id),
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_hotel ON loyalty_points(hotel_id);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own loyalty points" ON loyalty_points;
  CREATE POLICY "Users view own loyalty points" ON loyalty_points FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS "Hotel team manages loyalty points" ON loyalty_points;
  CREATE POLICY "Hotel team manages loyalty points" ON loyalty_points FOR ALL USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = loyalty_points.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
END $$;

-- ============================================================
-- TICKET MESSAGES (support chat thread)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'guest',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender_id);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Ticket participants view messages" ON ticket_messages;
  CREATE POLICY "Ticket participants view messages" ON ticket_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'hotel_owner', 'staff'))
  );
  DROP POLICY IF EXISTS "Ticket participants send messages" ON ticket_messages;
  CREATE POLICY "Ticket participants send messages" ON ticket_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );
END $$;

-- Apply updated_at triggers (safe: will skip if trigger already exists)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['banners', 'loyalty_tiers', 'loyalty_rewards'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'set_updated_at' AND event_object_table = t
    ) THEN
      EXECUTE format('
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
      ', t);
    END IF;
  END LOOP;
END;
$$;
