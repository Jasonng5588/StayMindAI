-- ============================================================
-- StayMind AI – Database Schema
-- Full production schema with RLS, indexes, soft delete
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'hotel_owner', 'staff', 'guest');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('stripe', 'cash', 'bank_transfer');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning', 'out_of_order');
CREATE TYPE housekeeping_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE maintenance_status AS ENUM ('reported', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trial');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'checkin', 'checkout', 'housekeeping', 'maintenance', 'system', 'marketing');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
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

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_deleted ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. HOTELS
-- ============================================================
CREATE TABLE hotels (
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
  check_out_time TIME DEFAULT '11:00',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_hotels_owner ON hotels(owner_id);
CREATE INDEX idx_hotels_slug ON hotels(slug);
CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_active ON hotels(is_active) WHERE is_active = true;
CREATE INDEX idx_hotels_deleted ON hotels(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. HOTEL STAFF
-- ============================================================
CREATE TABLE hotel_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(hotel_id, user_id)
);

CREATE INDEX idx_hotel_staff_hotel ON hotel_staff(hotel_id);
CREATE INDEX idx_hotel_staff_user ON hotel_staff(user_id);

-- ============================================================
-- 4. ROOM TYPES
-- ============================================================
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  bed_type TEXT,
  room_size DECIMAL(8,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_room_types_hotel ON room_types(hotel_id);

-- ============================================================
-- 5. ROOMS
-- ============================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER,
  status room_status NOT NULL DEFAULT 'available',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(hotel_id, room_number)
);

CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- ============================================================
-- 6. ROOM INVENTORY (availability per date)
-- ============================================================
CREATE TABLE room_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_rooms INTEGER NOT NULL DEFAULT 0,
  booked_rooms INTEGER NOT NULL DEFAULT 0,
  blocked_rooms INTEGER NOT NULL DEFAULT 0,
  price_override DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, date)
);

CREATE INDEX idx_room_inventory_hotel_date ON room_inventory(hotel_id, date);
CREATE INDEX idx_room_inventory_type_date ON room_inventory(room_type_id, date);

-- ============================================================
-- 7. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id),
  room_id UUID REFERENCES rooms(id),
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  booking_number TEXT UNIQUE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  num_rooms INTEGER NOT NULL DEFAULT 1,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  promo_code TEXT,
  special_requests TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  qr_code TEXT,
  source TEXT DEFAULT 'web',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

-- ============================================================
-- 8. BOOKING GUESTS
-- ============================================================
CREATE TABLE booking_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_type TEXT,
  id_number TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_guests_booking ON booking_guests(booking_id);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  method payment_method NOT NULL DEFAULT 'stripe',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_hotel ON payments(hotel_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- ============================================================
-- 10. SUBSCRIPTIONS (SaaS billing)
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'trial',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_hotel ON subscriptions(hotel_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================
-- 11. INVOICES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  subscription_id UUID REFERENCES subscriptions(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  line_items JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_hotel ON invoices(hotel_id);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);

-- ============================================================
-- 12. SERVICES / ADD-ONS
-- ============================================================
CREATE TABLE services_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_services_hotel ON services_addons(hotel_id);

-- ============================================================
-- 13. HOUSEKEEPING TASKS
-- ============================================================
CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  status housekeeping_status NOT NULL DEFAULT 'pending',
  priority maintenance_priority NOT NULL DEFAULT 'medium',
  notes TEXT,
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_housekeeping_hotel ON housekeeping_tasks(hotel_id);
CREATE INDEX idx_housekeeping_room ON housekeeping_tasks(room_id);
CREATE INDEX idx_housekeeping_status ON housekeeping_tasks(status);
CREATE INDEX idx_housekeeping_assigned ON housekeeping_tasks(assigned_to);

-- ============================================================
-- 14. MAINTENANCE TASKS
-- ============================================================
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  reported_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority maintenance_priority NOT NULL DEFAULT 'medium',
  status maintenance_status NOT NULL DEFAULT 'reported',
  category TEXT,
  cost DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_hotel ON maintenance_tasks(hotel_id);
CREATE INDEX idx_maintenance_room ON maintenance_tasks(room_id);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_priority ON maintenance_tasks(priority);

-- ============================================================
-- 15. REVIEWS
-- ============================================================
CREATE TABLE reviews (
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

CREATE INDEX idx_reviews_hotel ON reviews(hotel_id);
CREATE INDEX idx_reviews_guest ON reviews(guest_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_hotel ON notifications(hotel_id);
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;

-- ============================================================
-- 17. CHAT MESSAGES
-- ============================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_hotel ON chat_messages(hotel_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_booking ON chat_messages(booking_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);

-- ============================================================
-- 18. AI LOGS
-- ============================================================
CREATE TABLE ai_logs (
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

CREATE INDEX idx_ai_logs_hotel ON ai_logs(hotel_id);
CREATE INDEX idx_ai_logs_feature ON ai_logs(feature);
CREATE INDEX idx_ai_logs_created ON ai_logs(created_at DESC);

-- ============================================================
-- 19. PRICE RULES (AI dynamic pricing)
-- ============================================================
CREATE TABLE price_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  adjustment_type TEXT NOT NULL DEFAULT 'percentage',
  adjustment_value DECIMAL(10,2) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_rules_hotel ON price_rules(hotel_id);
CREATE INDEX idx_price_rules_type ON price_rules(room_type_id);

-- ============================================================
-- 20. OCCUPANCY FORECASTS
-- ============================================================
CREATE TABLE occupancy_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_occupancy DECIMAL(5,2) NOT NULL,
  actual_occupancy DECIMAL(5,2),
  confidence DECIMAL(3,2),
  factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, forecast_date)
);

CREATE INDEX idx_forecasts_hotel_date ON occupancy_forecasts(hotel_id, forecast_date);

-- ============================================================
-- 21. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_hotel ON audit_logs(hotel_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- 22. DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_hotel ON documents(hotel_id);

-- ============================================================
-- 23. SUPPORT TICKETS
-- ============================================================
CREATE TABLE support_tickets (
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

CREATE INDEX idx_tickets_hotel ON support_tickets(hotel_id);
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TABLE promo_codes (
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

CREATE INDEX idx_promo_hotel ON promo_codes(hotel_id);
CREATE INDEX idx_promo_code ON promo_codes(code);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, super_admin can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admin full access profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Hotels: owner can manage, staff can view, guests can view active
CREATE POLICY "Hotel owner full access" ON hotels FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Staff can view their hotel" ON hotels FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Guests can view active hotels" ON hotels FOR SELECT USING (is_active = true AND is_suspended = false AND deleted_at IS NULL);
CREATE POLICY "Super admin full access hotels" ON hotels FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Hotel Staff: hotel owner manages, staff reads own
CREATE POLICY "Hotel owner manages staff" ON hotel_staff FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view own record" ON hotel_staff FOR SELECT USING (user_id = auth.uid());

-- Room Types: hotel owner/staff manage, guests view active
CREATE POLICY "Hotel team manages room types" ON room_types FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = room_types.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Public can view active room types" ON room_types FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Rooms: hotel owner/staff manage
CREATE POLICY "Hotel team manages rooms" ON rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = rooms.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Room Inventory: hotel team manages, public can view
CREATE POLICY "Hotel team manages inventory" ON room_inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = room_inventory.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Public can view inventory" ON room_inventory FOR SELECT USING (true);

-- Bookings: guests see own, hotel team sees hotel bookings
CREATE POLICY "Guests view own bookings" ON bookings FOR SELECT USING (guest_id = auth.uid());
CREATE POLICY "Guests create bookings" ON bookings FOR INSERT WITH CHECK (guest_id = auth.uid());
CREATE POLICY "Hotel team manages bookings" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = bookings.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Booking Guests: link to booking access
CREATE POLICY "Booking guest access" ON booking_guests FOR ALL USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (
    guest_id = auth.uid()
    OR EXISTS (SELECT 1 FROM hotels WHERE id = bookings.hotel_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = bookings.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
  ))
);

-- Payments: similar to bookings
CREATE POLICY "Payment access" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (
    guest_id = auth.uid()
    OR EXISTS (SELECT 1 FROM hotels WHERE id = bookings.hotel_id AND owner_id = auth.uid())
  ))
);

-- Subscriptions: hotel owner
CREATE POLICY "Owner manages subscription" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);

-- Invoices: hotel owner
CREATE POLICY "Owner manages invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);

-- Services: hotel team manages, public views
CREATE POLICY "Hotel team manages services" ON services_addons FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = services_addons.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Public views services" ON services_addons FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Housekeeping: hotel team
CREATE POLICY "Hotel team manages housekeeping" ON housekeeping_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = housekeeping_tasks.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Maintenance: hotel team
CREATE POLICY "Hotel team manages maintenance" ON maintenance_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = maintenance_tasks.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Reviews: guests write own, hotel team reads, public reads published
CREATE POLICY "Guests manage own reviews" ON reviews FOR ALL USING (guest_id = auth.uid());
CREATE POLICY "Hotel team reads reviews" ON reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = reviews.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Public reads published reviews" ON reviews FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Notifications: users see own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Chat: participants only
CREATE POLICY "Chat participants" ON chat_messages FOR ALL USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
  OR EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = chat_messages.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- AI Logs: hotel owner + super admin
CREATE POLICY "Hotel owner views ai logs" ON ai_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
CREATE POLICY "Super admin views all ai logs" ON ai_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Price Rules: hotel team
CREATE POLICY "Hotel team manages price rules" ON price_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = price_rules.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Occupancy Forecasts: hotel team
CREATE POLICY "Hotel team views forecasts" ON occupancy_forecasts FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = occupancy_forecasts.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Audit Logs: hotel owner + super admin
CREATE POLICY "Hotel owner views audit" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
CREATE POLICY "Super admin views all audit" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Documents: hotel team
CREATE POLICY "Hotel team manages documents" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = documents.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);

-- Support Tickets: user own + hotel owner + super admin
CREATE POLICY "Users manage own tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Hotel owner views hotel tickets" ON support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
CREATE POLICY "Super admin views all tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Promo Codes: hotel team manages, public validates
CREATE POLICY "Hotel team manages promos" ON promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM hotel_staff WHERE hotel_id = promo_codes.hotel_id AND user_id = auth.uid() AND deleted_at IS NULL)
);
CREATE POLICY "Public validates promos" ON promo_codes FOR SELECT USING (is_active = true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
    ', t);
  END LOOP;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'guest')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'BK-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_number();

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();
