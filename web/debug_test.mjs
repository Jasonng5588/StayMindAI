import { createClient } from '@supabase/supabase-js'

const url = 'https://obrwbyyvmoepuqhyceyf.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icndieXl2bW9lcHVxaHljZXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNjM3OCwiZXhwIjoyMDg3NTEyMzc4fQ.NWiIHUZ1xVjXLrf_reGM-s0tzc-odpQJA8kCC6ZsQLY'

const supabase = createClient(url, key)

async function test() {
    console.log('=== TESTING ALL TABLES ===\n')

    // 1. Test hotels table
    const { data: hotels, error: hErr } = await supabase.from('hotels').select('id, name, is_active').limit(3)
    console.log('HOTELS:', hotels?.length || 0, 'found', hErr ? `ERROR: ${hErr.message}` : 'OK')
    if (hotels?.[0]) console.log('  First hotel:', hotels[0].id, hotels[0].name)

    // 2. Test profiles table
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email, role').limit(3)
    console.log('PROFILES:', profiles?.length || 0, 'found', pErr ? `ERROR: ${pErr.message}` : 'OK')
    if (profiles?.[0]) console.log('  First profile:', profiles[0].id, profiles[0].full_name, profiles[0].role)

    // 3. Test rooms table
    const { data: rooms, error: rErr } = await supabase.from('rooms').select('id, name, status, base_price, hotel_id').limit(3)
    console.log('ROOMS:', rooms?.length || 0, 'found', rErr ? `ERROR: ${rErr.message}` : 'OK')
    if (rooms) rooms.forEach(r => console.log('  Room:', r.name, 'status:', r.status, 'price:', r.base_price))

    // 4. Test support_tickets table  
    const { data: tickets, error: tErr } = await supabase.from('support_tickets').select('*').limit(3)
    console.log('SUPPORT_TICKETS:', tickets?.length || 0, 'found', tErr ? `ERROR: ${tErr.message}` : 'OK')
    if (tickets?.[0]) console.log('  First ticket:', JSON.stringify(tickets[0]).substring(0, 200))

    // 5. Test support_tickets with profiles join
    const { data: ticketsJoin, error: tjErr } = await supabase
        .from('support_tickets')
        .select('*, profiles(full_name, email)')
        .limit(3)
    console.log('TICKETS+PROFILES JOIN:', ticketsJoin?.length || 0, 'found', tjErr ? `ERROR: ${tjErr.message}` : 'OK')

    // 6. Test ticket_messages table
    const { data: msgs, error: mErr } = await supabase.from('ticket_messages').select('*').limit(3)
    console.log('TICKET_MESSAGES:', msgs?.length || 0, 'found', mErr ? `ERROR: ${mErr.message}` : 'OK')

    // 7. Test loyalty_points table - check columns
    const { data: lp, error: lpErr } = await supabase.from('loyalty_points').select('*').limit(1)
    console.log('LOYALTY_POINTS:', lp?.length || 0, 'found', lpErr ? `ERROR: ${lpErr.message}` : 'OK')
    if (lp?.[0]) console.log('  Columns:', Object.keys(lp[0]).join(', '))

    // 8. Test loyalty_tiers table
    const { data: lt, error: ltErr } = await supabase.from('loyalty_tiers').select('*').limit(3)
    console.log('LOYALTY_TIERS:', lt?.length || 0, 'found', ltErr ? `ERROR: ${ltErr.message}` : 'OK')
    if (lt?.[0]) console.log('  Columns:', Object.keys(lt[0]).join(', '))

    // 9. Test loyalty_rewards table
    const { data: lr, error: lrErr } = await supabase.from('loyalty_rewards').select('*').limit(3)
    console.log('LOYALTY_REWARDS:', lr?.length || 0, 'found', lrErr ? `ERROR: ${lrErr.message}` : 'OK')
    if (lr?.[0]) console.log('  Columns:', Object.keys(lr[0]).join(', '))

    // 10. Test banners table - check columns
    const { data: banners, error: bErr } = await supabase.from('banners').select('*').limit(3)
    console.log('BANNERS:', banners?.length || 0, 'found', bErr ? `ERROR: ${bErr.message}` : 'OK')
    if (banners?.[0]) console.log('  Columns:', Object.keys(banners[0]).join(', '))

    // 11. Test notifications table
    const { data: notifs, error: nErr } = await supabase.from('notifications').select('*').limit(1)
    console.log('NOTIFICATIONS:', notifs?.length || 0, 'found', nErr ? `ERROR: ${nErr.message}` : 'OK')

    // 12. Test bookings table
    const { data: bookings, error: boErr } = await supabase.from('bookings').select('*').limit(1)
    console.log('BOOKINGS:', bookings?.length || 0, 'found', boErr ? `ERROR: ${boErr.message}` : 'OK')

    // 13. Test payments table
    const { data: payments, error: paErr } = await supabase.from('payments').select('*').limit(1)
    console.log('PAYMENTS:', payments?.length || 0, 'found', paErr ? `ERROR: ${paErr.message}` : 'OK')

    // 14. Try inserting a test banner to see if hotel_id constraint works
    const hotelId = hotels?.[0]?.id
    if (hotelId) {
        console.log('\n=== TEST INSERT ===')
        const { data: testBanner, error: tbErr } = await supabase
            .from('banners')
            .insert({ hotel_id: hotelId, title: 'Test Banner', position: 1 })
            .select()
            .single()
        console.log('INSERT BANNER:', testBanner ? 'SUCCESS' : 'FAILED', tbErr ? `ERROR: ${tbErr.message}` : '')
        if (testBanner) {
            console.log('  Banner ID:', testBanner.id)
            // Clean up
            await supabase.from('banners').delete().eq('id', testBanner.id)
            console.log('  Cleaned up test banner')
        }
    }

    // 15. Check room_types table
    const { data: rt, error: rtErr } = await supabase.from('room_types').select('*').limit(3)
    console.log('ROOM_TYPES:', rt?.length || 0, 'found', rtErr ? `ERROR: ${rtErr.message}` : 'OK')
}

test().catch(console.error)
