-- ============================================================
-- Migration Phase 3: Create MISSING tables (promo_codes, reviews, ai_logs)
-- These tables are defined in schema.sql but were never applied to DB.
-- Verified missing via Supabase REST API (all return 404).
-- Idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_booking_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promo_hotel ON promo_codes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_promo_code ON promo_codes(code);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Hotel team manages promos" ON promo_codes;
  CREATE POLICY "Hotel team manages promos" ON promo_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = promo_codes.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
  DROP POLICY IF EXISTS "Public validates promos" ON promo_codes;
  CREATE POLICY "Public validates promos" ON promo_codes FOR SELECT USING (is_active = true);
END $$;

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  guest_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  response TEXT,
  responded_at TIMESTAMPTZ,
  sentiment_score DECIMAL(3,2),
  sentiment_summary TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guest ON reviews(guest_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Guests manage own reviews" ON reviews;
  CREATE POLICY "Guests manage own reviews" ON reviews FOR ALL USING (guest_id = auth.uid());
  DROP POLICY IF EXISTS "Hotel team reads reviews" ON reviews;
  CREATE POLICY "Hotel team reads reviews" ON reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = reviews.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  );
  DROP POLICY IF EXISTS "Public reads published reviews" ON reviews;
  CREATE POLICY "Public reads published reviews" ON reviews FOR SELECT USING (is_published = true AND deleted_at IS NULL);
END $$;

-- ============================================================
-- AI LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  feature TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  model TEXT DEFAULT 'gemini-pro',
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  status TEXT DEFAULT 'success',
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_hotel ON ai_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at DESC);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Hotel owner views ai logs" ON ai_logs;
  CREATE POLICY "Hotel owner views ai logs" ON ai_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  );
  DROP POLICY IF EXISTS "Super admin views all ai logs" ON ai_logs;
  CREATE POLICY "Super admin views all ai logs" ON ai_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
  -- Allow insert from service role (for logging AI calls)
  DROP POLICY IF EXISTS "Service inserts ai logs" ON ai_logs;
  CREATE POLICY "Service inserts ai logs" ON ai_logs FOR INSERT WITH CHECK (true);
END $$;

-- Apply updated_at triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['promo_codes', 'reviews'])
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
