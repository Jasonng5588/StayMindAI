-- ============================================================
-- StayMind AI – Seed Data
-- Sample data for development and testing
-- ============================================================

-- Note: In production, users are created via Supabase Auth.
-- For seeding, we insert directly into profiles (auth.users must exist first).
-- Run this AFTER setting up auth users in the Supabase dashboard.

-- ============================================================
-- SAMPLE HOTELS
-- ============================================================
-- These use placeholder UUIDs. Replace owner_id with real user IDs after auth setup.

INSERT INTO hotels (id, owner_id, name, slug, description, address, city, state, country, zip_code, phone, email, star_rating, amenities, check_in_time, check_out_time, currency, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001',
   'The Grand Azure', 'the-grand-azure',
   'A luxury beachfront resort offering world-class amenities, stunning ocean views, and unparalleled hospitality.',
   '123 Ocean Drive', 'Miami', 'FL', 'US', '33139',
   '+1-305-555-0100', 'info@grandazure.com', 5,
   ARRAY['pool', 'spa', 'gym', 'restaurant', 'bar', 'beach_access', 'wifi', 'parking', 'room_service', 'concierge'],
   '15:00', '11:00', 'USD', true),

  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002',
   'Mountain Vista Lodge', 'mountain-vista-lodge',
   'A cozy mountain retreat surrounded by nature, perfect for adventure seekers and relaxation enthusiasts alike.',
   '456 Alpine Road', 'Aspen', 'CO', 'US', '81611',
   '+1-970-555-0200', 'hello@mountainvista.com', 4,
   ARRAY['ski_access', 'fireplace', 'spa', 'restaurant', 'wifi', 'parking', 'hiking', 'hot_tub'],
   '16:00', '10:00', 'USD', true),

  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002',
   'Urban Boutique Hotel', 'urban-boutique-hotel',
   'A stylish boutique hotel in the heart of downtown, blending modern design with local culture.',
   '789 Main Street', 'New York', 'NY', 'US', '10001',
   '+1-212-555-0300', 'stay@urbanboutique.com', 4,
   ARRAY['wifi', 'gym', 'restaurant', 'bar', 'rooftop', 'coworking', 'laundry'],
   '14:00', '12:00', 'USD', true);

-- ============================================================
-- ROOM TYPES
-- ============================================================
INSERT INTO room_types (id, hotel_id, name, description, base_price, max_occupancy, amenities, bed_type, room_size, is_active)
VALUES
  -- Grand Azure rooms
  ('aaaa1111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111',
   'Ocean View Deluxe', 'Spacious room with panoramic ocean views, king bed, and private balcony.',
   299.00, 2, ARRAY['ocean_view', 'balcony', 'minibar', 'smart_tv', 'safe'], 'King', 45.0, true),
  ('aaaa1111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111',
   'Garden Suite', 'Elegant suite overlooking tropical gardens with separate living area.',
   449.00, 4, ARRAY['garden_view', 'living_room', 'minibar', 'jacuzzi', 'smart_tv'], 'King', 75.0, true),
  ('aaaa1111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111',
   'Standard Room', 'Comfortable room with modern amenities and city views.',
   179.00, 2, ARRAY['city_view', 'smart_tv', 'safe', 'desk'], 'Queen', 30.0, true),

  -- Mountain Vista rooms
  ('aaaa2222-0002-0002-0002-000000000001', '22222222-2222-2222-2222-222222222222',
   'Mountain King Suite', 'Premium suite with mountain views, fireplace, and private hot tub.',
   389.00, 2, ARRAY['mountain_view', 'fireplace', 'hot_tub', 'minibar', 'balcony'], 'King', 60.0, true),
  ('aaaa2222-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222',
   'Cozy Cabin Room', 'Rustic-modern cabin-style room with all comforts.',
   199.00, 2, ARRAY['mountain_view', 'fireplace', 'smart_tv', 'desk'], 'Queen', 35.0, true),
  ('aaaa2222-0002-0002-0002-000000000003', '22222222-2222-2222-2222-222222222222',
   'Family Lodge', 'Spacious family room with bunk beds and play area.',
   279.00, 6, ARRAY['mountain_view', 'bunk_beds', 'play_area', 'kitchenette'], 'Multiple', 80.0, true),

  -- Urban Boutique rooms
  ('aaaa3333-0003-0003-0003-000000000001', '33333333-3333-3333-3333-333333333333',
   'Designer Loft', 'Open-plan loft with curated art, city skyline views.',
   259.00, 2, ARRAY['skyline_view', 'smart_tv', 'nespresso', 'desk', 'rain_shower'], 'King', 40.0, true),
  ('aaaa3333-0003-0003-0003-000000000002', '33333333-3333-3333-3333-333333333333',
   'Classic Double', 'Well-appointed double room in the heart of the city.',
   149.00, 2, ARRAY['city_view', 'smart_tv', 'desk', 'safe'], 'Double', 25.0, true);

-- ============================================================
-- ROOMS
-- ============================================================
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
VALUES
  -- Grand Azure
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000001', '101', 1, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000001', '102', 1, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000001', '103', 1, 'occupied'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000002', '201', 2, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000002', '202', 2, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000003', '301', 3, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000003', '302', 3, 'maintenance'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000003', '303', 3, 'available'),
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-0001-0001-0001-000000000003', '304', 3, 'cleaning'),

  -- Mountain Vista
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000001', 'S1', 1, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000001', 'S2', 1, 'occupied'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000002', 'C1', 1, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000002', 'C2', 1, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000002', 'C3', 1, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000003', 'F1', 2, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-0002-0002-0002-000000000003', 'F2', 2, 'available'),

  -- Urban Boutique
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000001', '401', 4, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000001', '402', 4, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000001', '403', 4, 'occupied'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000002', '501', 5, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000002', '502', 5, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000002', '503', 5, 'available'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa3333-0003-0003-0003-000000000002', '504', 5, 'available');

-- ============================================================
-- SERVICES & ADD-ONS
-- ============================================================
INSERT INTO services_addons (hotel_id, name, description, price, category, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Airport Transfer', 'Luxury car pickup from Miami International Airport', 75.00, 'transport', true),
  ('11111111-1111-1111-1111-111111111111', 'Spa Package', 'Full-day spa treatment including massage and facial', 250.00, 'wellness', true),
  ('11111111-1111-1111-1111-111111111111', 'Late Checkout', 'Extend checkout until 3 PM', 50.00, 'room', true),
  ('11111111-1111-1111-1111-111111111111', 'Breakfast Buffet', 'Full breakfast buffet per person per day', 35.00, 'dining', true),
  ('22222222-2222-2222-2222-222222222222', 'Ski Pass', 'Full-day ski lift pass', 120.00, 'activities', true),
  ('22222222-2222-2222-2222-222222222222', 'Guided Hike', '3-hour guided mountain hike', 65.00, 'activities', true),
  ('33333333-3333-3333-3333-333333333333', 'City Tour', 'Half-day guided city tour', 85.00, 'activities', true),
  ('33333333-3333-3333-3333-333333333333', 'Coworking Day Pass', 'Full-day access to rooftop coworking space', 30.00, 'business', true);

-- ============================================================
-- PROMO CODES
-- ============================================================
INSERT INTO promo_codes (hotel_id, code, description, discount_type, discount_value, min_booking_amount, max_discount, usage_limit, valid_from, valid_to, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'WELCOME20', 'Welcome discount for new guests', 'percentage', 20.00, 200.00, 100.00, 100, now(), now() + interval '90 days', true),
  ('11111111-1111-1111-1111-111111111111', 'SUMMER50', 'Summer special - $50 off', 'fixed', 50.00, 300.00, NULL, 50, now(), now() + interval '60 days', true),
  ('22222222-2222-2222-2222-222222222222', 'SKISEASON', 'Ski season 15% discount', 'percentage', 15.00, 150.00, 75.00, 200, now(), now() + interval '120 days', true),
  ('33333333-3333-3333-3333-333333333333', 'NYC10', 'New York City 10% off', 'percentage', 10.00, 100.00, 50.00, NULL, now(), now() + interval '365 days', true);
