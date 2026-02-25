import { createClient } from '@supabase/supabase-js'

const url = 'https://obrwbyyvmoepuqhyceyf.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icndieXl2bW9lcHVxaHljZXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNjM3OCwiZXhwIjoyMDg3NTEyMzc4fQ.NWiIHUZ1xVjXLrf_reGM-s0tzc-odpQJA8kCC6ZsQLY'

const supabase = createClient(url, key)

async function seed() {
    console.log('=== SEEDING DATA ===\n')

    // Get the existing user profile to use as owner_id
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').limit(1)
    if (!profiles || profiles.length === 0) {
        console.error('ERROR: No profiles found! Cannot seed hotel.')
        return
    }
    const ownerId = profiles[0].id
    console.log('Using owner:', ownerId, profiles[0].full_name)

    // Update the user to hotel_owner role so they can manage hotels
    await supabase.from('profiles').update({ role: 'hotel_owner' }).eq('id', ownerId)
    console.log('Updated user role to hotel_owner')

    // Check if hotel already exists
    const { data: existingHotels } = await supabase.from('hotels').select('id').limit(1)
    if (existingHotels && existingHotels.length > 0) {
        console.log('Hotel already exists:', existingHotels[0].id)
        return
    }

    // Create a hotel
    const { data: hotel, error: hotelErr } = await supabase
        .from('hotels')
        .insert({
            owner_id: ownerId,
            name: 'StayMind Grand Hotel',
            slug: 'staymind-grand-hotel',
            description: 'A luxurious 5-star hotel in the heart of Kuala Lumpur, Malaysia. Experience world-class hospitality with stunning city views.',
            address: '168 Jalan Bukit Bintang',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            country: 'Malaysia',
            zip_code: '55100',
            latitude: 3.1478,
            longitude: 101.7106,
            phone: '+603-2141-8000',
            email: 'info@staymindgrand.com',
            website: 'https://staymindgrand.com',
            star_rating: 5,
            amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service', 'Concierge', 'Valet Parking', 'Business Center'],
            is_active: true,
        })
        .select()
        .single()

    if (hotelErr) {
        console.error('ERROR creating hotel:', hotelErr.message)
        return
    }
    console.log('Created hotel:', hotel.id, hotel.name)

    // Create rooms
    const roomsData = [
        { hotel_id: hotel.id, name: 'Deluxe Room', room_number: '101', floor: 1, room_type: 'deluxe', description: 'Spacious deluxe room with city view', base_price: 250, max_occupancy: 2, amenities: ['WiFi', 'TV', 'Minibar', 'Safe'], status: 'available' },
        { hotel_id: hotel.id, name: 'Deluxe Room', room_number: '102', floor: 1, room_type: 'deluxe', description: 'Spacious deluxe room with garden view', base_price: 250, max_occupancy: 2, amenities: ['WiFi', 'TV', 'Minibar', 'Safe'], status: 'available' },
        { hotel_id: hotel.id, name: 'Superior Room', room_number: '201', floor: 2, room_type: 'superior', description: 'Superior room with panoramic city view', base_price: 380, max_occupancy: 3, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Bathtub'], status: 'available' },
        { hotel_id: hotel.id, name: 'Superior Room', room_number: '202', floor: 2, room_type: 'superior', description: 'Superior room with balcony', base_price: 380, max_occupancy: 3, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Bathtub', 'Balcony'], status: 'available' },
        { hotel_id: hotel.id, name: 'Executive Suite', room_number: '301', floor: 3, room_type: 'suite', description: 'Luxurious executive suite with living area', base_price: 580, max_occupancy: 4, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Bathtub', 'Living Area', 'Jacuzzi'], status: 'available' },
        { hotel_id: hotel.id, name: 'Executive Suite', room_number: '302', floor: 3, room_type: 'suite', description: 'Corner suite with floor-to-ceiling windows', base_price: 580, max_occupancy: 4, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Bathtub', 'Living Area'], status: 'occupied' },
        { hotel_id: hotel.id, name: 'Presidential Suite', room_number: '501', floor: 5, room_type: 'presidential', description: 'The finest suite with private terrace and butler service', base_price: 1200, max_occupancy: 6, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Bathtub', 'Living Area', 'Jacuzzi', 'Private Terrace', 'Butler Service'], status: 'available' },
        { hotel_id: hotel.id, name: 'Standard Room', room_number: '103', floor: 1, room_type: 'standard', description: 'Comfortable standard room', base_price: 150, max_occupancy: 2, amenities: ['WiFi', 'TV'], status: 'available' },
        { hotel_id: hotel.id, name: 'Standard Room', room_number: '104', floor: 1, room_type: 'standard', description: 'Comfortable standard room with city view', base_price: 150, max_occupancy: 2, amenities: ['WiFi', 'TV'], status: 'maintenance' },
        { hotel_id: hotel.id, name: 'Family Room', room_number: '401', floor: 4, room_type: 'family', description: 'Large family room with extra beds', base_price: 450, max_occupancy: 5, amenities: ['WiFi', 'TV', 'Minibar', 'Safe', 'Extra Beds'], status: 'available' },
    ]

    const { data: rooms, error: roomErr } = await supabase
        .from('rooms')
        .insert(roomsData)
        .select()

    if (roomErr) {
        console.error('ERROR creating rooms:', roomErr.message)
        return
    }
    console.log(`Created ${rooms.length} rooms`)

    // Count available rooms
    const available = rooms.filter(r => r.status === 'available').length
    console.log(`Available rooms: ${available}`)

    // Create default loyalty tiers
    const tiersData = [
        { hotel_id: hotel.id, name: 'Bronze', min_points: 0, multiplier: 1.0, sort_order: 1, benefits: ['Welcome drink', '5% dining discount'] },
        { hotel_id: hotel.id, name: 'Silver', min_points: 500, multiplier: 1.5, sort_order: 2, benefits: ['Late checkout', '10% dining discount', 'Free breakfast'] },
        { hotel_id: hotel.id, name: 'Gold', min_points: 2000, multiplier: 2.0, sort_order: 3, benefits: ['Room upgrade', '15% dining discount', 'Free breakfast', 'Spa access'] },
        { hotel_id: hotel.id, name: 'Platinum', min_points: 5000, multiplier: 3.0, sort_order: 4, benefits: ['Suite upgrade', '20% discount on all', 'Free breakfast & dinner', 'Airport transfer', 'Butler service'] },
    ]

    const { error: tiersErr } = await supabase.from('loyalty_tiers').insert(tiersData)
    if (tiersErr) console.error('Tiers error:', tiersErr.message)
    else console.log('Created 4 loyalty tiers')

    // Create default rewards
    const rewardsData = [
        { hotel_id: hotel.id, name: 'Free Night Stay', description: 'Redeem for one free night in a Standard Room', points_cost: 5000, category: 'Room', is_active: true },
        { hotel_id: hotel.id, name: 'Spa Package', description: 'Full body massage and spa treatment', points_cost: 2000, category: 'Spa', is_active: true },
        { hotel_id: hotel.id, name: 'Dinner for Two', description: 'Fine dining experience at our restaurant', points_cost: 1500, category: 'Dining', is_active: true },
        { hotel_id: hotel.id, name: 'Room Upgrade', description: 'One-time upgrade to the next room category', points_cost: 1000, category: 'Room Upgrade', is_active: true },
    ]

    const { error: rewardsErr } = await supabase.from('loyalty_rewards').insert(rewardsData)
    if (rewardsErr) console.error('Rewards error:', rewardsErr.message)
    else console.log('Created 4 loyalty rewards')

    console.log('\n=== SEEDING COMPLETE ===')
    console.log(`Hotel: ${hotel.name} (${hotel.id})`)
    console.log(`Rooms: ${rooms.length} total, ${available} available`)
    console.log('Best Rate: RM 150')
}

seed().catch(console.error)
