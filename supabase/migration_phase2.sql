-- ============================================================
-- StayMind AI – Phase 2 Migration (Self-contained)
-- Safe to run on a fresh or existing Supabase database
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS (create only if missing)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'hotel_owner', 'staff', 'guest');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('stripe', 'cash', 'bank_transfer', 'card', 'tng_ewallet', 'duitnow_qr', 'fpx');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
        CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning', 'out_of_order');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'checkin', 'checkout', 'housekeeping', 'maintenance', 'system', 'marketing');
    END IF;
END
$$;

-- Add Malaysian payment methods to existing enum (safe if already exists)
DO $$
BEGIN
    BEGIN ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'tng_ewallet'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'duitnow_qr'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'fpx'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'card'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END
$$;

-- ============================================================
-- UTILITY FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PREREQUISITE TABLES (create only if missing)
-- ============================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'guest',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Hotels
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  logo_url TEXT,
  cover_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  policies JSONB DEFAULT '{}',
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '12:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  floor INTEGER,
  room_type TEXT NOT NULL DEFAULT 'standard',
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  status room_status NOT NULL DEFAULT 'available',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  booking_number TEXT UNIQUE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  promo_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MYR',
  method payment_method NOT NULL DEFAULT 'stripe',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Hotel Staff
CREATE TABLE IF NOT EXISTS hotel_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(hotel_id, user_id)
);

-- 7. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  category TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PHASE 2 TABLES
-- ============================================================

-- Loyalty Tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  benefits TEXT[] DEFAULT '{}',
  color TEXT DEFAULT 'from-amber-700 to-amber-500',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loyalty Rewards
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loyalty Points Ledger
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'earned',
  description TEXT,
  booking_id UUID REFERENCES bookings(id),
  reward_id UUID REFERENCES loyalty_rewards(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'guest',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES (safe: will skip if already exist)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_hotels_owner ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_hotel ON support_tickets(hotel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_hotel ON loyalty_tiers(hotel_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_hotel ON loyalty_rewards(hotel_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_hotel ON loyalty_points(hotel_id);
CREATE INDEX IF NOT EXISTS idx_banners_hotel ON banners(hotel_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Profiles
DO $$ BEGIN
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Admins can read all profiles (for admin panel)
DO $$ BEGIN
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner', 'staff'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Admins can update all profiles (role changes, suspend)
DO $$ BEGIN
CREATE POLICY "Admins update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin can read all bookings
DO $$ BEGIN
CREATE POLICY "Admins read all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner', 'staff'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin can read all payments
DO $$ BEGIN
CREATE POLICY "Admins read all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner', 'staff'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Admins update all payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin can read/update all support tickets
DO $$ BEGIN
CREATE POLICY "Admins manage all tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hotel_owner', 'staff'))
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications management
DO $$ BEGIN
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Hotels (public read)
DO $$ BEGIN
CREATE POLICY "Public reads active hotels" ON hotels FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Owner manages hotel" ON hotels FOR ALL USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Rooms (public read)
DO $$ BEGIN
CREATE POLICY "Public reads active rooms" ON rooms FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bookings
DO $$ BEGIN
CREATE POLICY "Users manage own bookings" ON bookings FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payments
DO $$ BEGIN
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Support Tickets
DO $$ BEGIN
CREATE POLICY "Users manage own tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications
DO $$ BEGIN
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Loyalty Tiers (public read)
DO $$ BEGIN
CREATE POLICY "Public views loyalty tiers" ON loyalty_tiers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Hotel team manages loyalty tiers" ON loyalty_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Loyalty Rewards
DO $$ BEGIN
CREATE POLICY "Public views active rewards" ON loyalty_rewards FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Hotel team manages loyalty rewards" ON loyalty_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Loyalty Points
DO $$ BEGIN
CREATE POLICY "Users view own points" ON loyalty_points FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Hotel team manages points" ON loyalty_points FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Banners
DO $$ BEGIN
CREATE POLICY "Public views active banners" ON banners FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Hotel team manages banners" ON banners FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ticket Messages
DO $$ BEGIN
CREATE POLICY "Ticket owner reads messages" ON ticket_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY "Super admin reads all ticket messages" ON ticket_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TRIGGERS
-- ============================================================
DO $$
BEGIN
    -- Drop and recreate triggers (safe)
    DROP TRIGGER IF EXISTS set_updated_at ON profiles;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON hotels;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON rooms;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON bookings;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON payments;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON support_tickets;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON loyalty_tiers;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON loyalty_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON loyalty_rewards;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    DROP TRIGGER IF EXISTS set_updated_at ON banners;
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
END
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
            'guest'
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Silently catch any error so signup never fails due to profile creation
        RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
