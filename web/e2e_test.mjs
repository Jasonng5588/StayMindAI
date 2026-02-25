import { createClient } from '@supabase/supabase-js'

const url = 'https://obrwbyyvmoepuqhyceyf.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icndieXl2bW9lcHVxaHljZXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNjM3OCwiZXhwIjoyMDg3NTEyMzc4fQ.NWiIHUZ1xVjXLrf_reGM-s0tzc-odpQJA8kCC6ZsQLY'

const s = createClient(url, key)

let pass = 0, fail = 0
async function test(name, fn) {
    try {
        await fn()
        console.log(`✅ ${name}`)
        pass++
    } catch (e) {
        console.log(`❌ ${name}: ${e.message}`)
        fail++
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg)
}

async function main() {
    console.log('=== COMPREHENSIVE E2E TEST ===\n')

    const { data: profiles } = await s.from('profiles').select('*').limit(1)
    const userId = profiles[0].id
    const { data: hotels } = await s.from('hotels').select('*').eq('is_active', true).limit(1)
    const hotelId = hotels?.[0]?.id
    const { data: rooms } = await s.from('rooms').select('*').eq('hotel_id', hotelId)

    console.log(`User: ${userId}, Hotel: ${hotelId}, Rooms: ${rooms?.length}\n`)

    // ==========================================
    // 1. ADMIN DATA API — All types
    // ==========================================
    console.log('--- ADMIN DATA API ---')

    await test('admin/data?type=dashboard', async () => {
        const { data: profs } = await s.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guest')
        const { data: rms } = await s.from('rooms').select('status, base_price')
        const { data: pmts } = await s.from('payments').select('amount, status')
        const { count: tktCount } = await s.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])
        const { count: bnrCount } = await s.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true)
        // Recent bookings with profile join
        const { data: rb, error: rbErr } = await s.from('bookings').select('*, rooms(name), profiles:user_id(full_name)').order('created_at', { ascending: false }).limit(5)
        assert(!rbErr, `recentBookings join: ${rbErr?.message}`)
        // Open tickets with profile join
        const { data: ot, error: otErr } = await s.from('support_tickets').select('*, profiles:user_id(full_name)').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5)
        assert(!otErr, `openTickets join: ${otErr?.message}`)
    })

    await test('admin/data?type=customers', async () => {
        const { data: p, error: e1 } = await s.from('profiles').select('*').eq('role', 'guest').is('deleted_at', null)
        assert(!e1, `profiles: ${e1?.message}`)
        const { data: b, error: e2 } = await s.from('bookings').select('*, rooms(name)').order('created_at', { ascending: false })
        assert(!e2, `bookings+rooms: ${e2?.message}`)
        const { data: lp, error: e3 } = await s.from('loyalty_points').select('*')
        assert(!e3, `loyalty_points: ${e3?.message}`)
    })

    await test('admin/data?type=users', async () => {
        const { error } = await s.from('profiles').select('*').order('created_at', { ascending: false })
        assert(!error, error?.message)
    })

    await test('admin/data?type=payments', async () => {
        const { error } = await s.from('payments').select('*, bookings(booking_number, check_in, check_out, rooms(name), profiles:user_id(full_name, email))').order('created_at', { ascending: false })
        assert(!error, error?.message)
    })

    await test('admin/data?type=support', async () => {
        const { data, error } = await s.from('support_tickets').select('*, profiles:user_id(full_name, email)').order('created_at', { ascending: false })
        assert(!error, error?.message)
        assert(data !== null, 'No data returned')
    })

    await test('admin/data?type=hotels', async () => {
        const { data, error } = await s.from('hotels').select('*').eq('is_active', true)
        assert(!error, error?.message)
        assert(data && data.length > 0, 'No hotels found!')
    })

    // ==========================================
    // 2. SUPPORT API
    // ==========================================
    console.log('\n--- SUPPORT API ---')

    await test('support GET (tickets list)', async () => {
        const { data, error } = await s.from('support_tickets').select('*, profiles:user_id(full_name, email)', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false })
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    await test('support GET (admin view, with hotel_id)', async () => {
        const { data, error } = await s.from('support_tickets').select('*, profiles:user_id(full_name, email)', { count: 'exact' }).order('created_at', { ascending: false })
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    await test('support POST (create ticket)', async () => {
        const { data, error } = await s.from('support_tickets').insert({
            user_id: userId, subject: 'E2E Test Ticket', description: 'Testing', category: 'General', priority: 'medium', status: 'open'
        }).select().single()
        assert(!error, error?.message)
        // Create initial message
        const { error: msgErr } = await s.from('ticket_messages').insert({ ticket_id: data.id, sender_id: userId, role: 'guest', message: 'Testing' })
        assert(!msgErr, `msg insert: ${msgErr?.message}`)
        // Clean up
        await s.from('ticket_messages').delete().eq('ticket_id', data.id)
        await s.from('support_tickets').delete().eq('id', data.id)
    })

    await test('support PATCH (update ticket)', async () => {
        const { data: t } = await s.from('support_tickets').select('id').limit(1).single()
        if (t) {
            const { error } = await s.from('support_tickets').update({ priority: 'high' }).eq('id', t.id)
            assert(!error, error?.message)
            await s.from('support_tickets').update({ priority: 'medium' }).eq('id', t.id)
        }
    })

    // ==========================================
    // 3. SUPPORT MESSAGES API
    // ==========================================
    console.log('\n--- SUPPORT MESSAGES API ---')

    await test('messages GET (with profiles join)', async () => {
        const { data: t } = await s.from('support_tickets').select('id').limit(1).single()
        if (t) {
            const { data, error } = await s.from('ticket_messages').select('*, profiles:sender_id(full_name)').eq('ticket_id', t.id).order('created_at', { ascending: true })
            assert(!error, `JOIN ERROR: ${error?.message}`)
        }
    })

    // ==========================================
    // 4. BANNERS API
    // ==========================================
    console.log('\n--- BANNERS API ---')

    await test('banners GET', async () => {
        const { data, error } = await s.from('banners').select('*').order('position', { ascending: true })
        assert(!error, error?.message)
    })

    await test('banners POST (create)', async () => {
        const { data, error } = await s.from('banners').insert({ hotel_id: hotelId, title: 'E2E Test Banner', position: 1 }).select().single()
        assert(!error, error?.message)
        assert(data, 'No data returned')
        // Clean up
        await s.from('banners').delete().eq('id', data.id)
    })

    await test('banners PATCH (update)', async () => {
        const { data: b } = await s.from('banners').insert({ hotel_id: hotelId, title: 'Patch Test', position: 1 }).select().single()
        const { error } = await s.from('banners').update({ title: 'Updated' }).eq('id', b.id)
        assert(!error, error?.message)
        await s.from('banners').delete().eq('id', b.id)
    })

    // ==========================================
    // 5. LOYALTY ADMIN API
    // ==========================================
    console.log('\n--- LOYALTY ADMIN API ---')

    await test('loyalty/admin GET (tiers)', async () => {
        const { data, error } = await s.from('loyalty_tiers').select('*').eq('hotel_id', hotelId).order('sort_order', { ascending: true })
        assert(!error, error?.message)
    })

    await test('loyalty/admin GET (rewards)', async () => {
        const { data, error } = await s.from('loyalty_rewards').select('*').eq('hotel_id', hotelId).order('points_cost', { ascending: true })
        assert(!error, error?.message)
    })

    await test('loyalty/admin GET (members with join)', async () => {
        const { data, error } = await s.from('loyalty_points').select('user_id, points, profiles(full_name, email)').eq('hotel_id', hotelId)
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    await test('loyalty/admin POST (adjust_points)', async () => {
        const { data: history } = await s.from('loyalty_points').select('points').eq('user_id', userId)
        const balance = history?.reduce((sum, p) => sum + p.points, 0) || 0
        const { data, error } = await s.from('loyalty_points').insert({
            user_id: userId, hotel_id: hotelId, points: 50, balance_after: balance + 50, type: 'adjusted', description: 'E2E test'
        }).select().single()
        assert(!error, error?.message)
        // Clean up
        await s.from('loyalty_points').delete().eq('id', data.id)
    })

    // ==========================================
    // 6. GUEST LOYALTY API
    // ==========================================
    console.log('\n--- GUEST LOYALTY API ---')

    await test('loyalty GET (user points)', async () => {
        const { data, error } = await s.from('loyalty_points').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        assert(!error, error?.message)
    })

    await test('loyalty GET (rewards for redeem)', async () => {
        const { data, error } = await s.from('loyalty_rewards').select('*').eq('is_active', true)
        assert(!error, error?.message)
    })

    // ==========================================
    // 7. BOOKINGS API
    // ==========================================
    console.log('\n--- BOOKINGS API ---')

    await test('bookings GET (user bookings)', async () => {
        const { data, error } = await s.from('bookings').select('*, rooms(room_number, name)', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false })
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    await test('bookings GET (admin, hotel bookings)', async () => {
        const { data, error } = await s.from('bookings').select('*, rooms(room_number, name)', { count: 'exact' }).eq('hotel_id', hotelId).order('created_at', { ascending: false })
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    await test('bookings POST (create booking)', async () => {
        const availRoom = rooms?.find(r => r.status === 'available')
        if (availRoom) {
            const { data, error } = await s.from('bookings').insert({
                hotel_id: hotelId, user_id: userId, room_id: availRoom.id,
                check_in: '2026-12-01', check_out: '2026-12-03', guests: 2,
                total_amount: 500, status: 'confirmed', booking_number: `BK-E2ETEST-${Date.now()}`
            }).select().single()
            assert(!error, error?.message)
            // Clean up
            await s.from('bookings').delete().eq('id', data.id)
        }
    })

    // ==========================================
    // 8. NOTIFICATIONS API
    // ==========================================
    console.log('\n--- NOTIFICATIONS API ---')

    await test('notifications GET', async () => {
        const { data, error } = await s.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false })
        assert(!error, error?.message)
    })

    await test('notifications INSERT + DELETE', async () => {
        const { data, error } = await s.from('notifications').insert({
            user_id: userId, type: 'system', title: 'E2E Test', message: 'Test notification'
        }).select().single()
        assert(!error, error?.message)
        await s.from('notifications').delete().eq('id', data.id)
    })

    // ==========================================
    // 9. PAYMENTS QUERY (admin)
    // ==========================================
    console.log('\n--- PAYMENTS ---')

    await test('payments with bookings join', async () => {
        const { data, error } = await s.from('payments').select('*, bookings(booking_number, check_in, check_out, rooms(name), profiles:user_id(full_name, email))').order('created_at', { ascending: false })
        assert(!error, `JOIN ERROR: ${error?.message}`)
    })

    // ==========================================
    // 10. AVAILABILITY CHECK
    // ==========================================
    console.log('\n--- AVAILABILITY ---')

    await test('rooms availability query', async () => {
        const { data, error } = await s.from('rooms').select('id, room_number, floor').eq('hotel_id', hotelId).eq('status', 'available')
        assert(!error, error?.message)
        assert(data && data.length > 0, 'No available rooms found')
    })

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail} tests ===`)
    if (fail > 0) process.exit(1)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
