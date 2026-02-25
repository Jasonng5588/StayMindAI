import { createClient } from '@supabase/supabase-js'

const url = 'https://obrwbyyvmoepuqhyceyf.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icndieXl2bW9lcHVxaHljZXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNjM3OCwiZXhwIjoyMDg3NTEyMzc4fQ.NWiIHUZ1xVjXLrf_reGM-s0tzc-odpQJA8kCC6ZsQLY'

const supabase = createClient(url, key)

async function verify() {
    console.log('=== VERIFICATION TEST ===\n')

    // 1. Hotels exist
    const { data: hotels } = await supabase.from('hotels').select('id, name, is_active').limit(3)
    console.log('1. HOTELS:', hotels?.length, 'found - ', hotels?.[0]?.name || 'NONE')

    // 2. Rooms exist
    const { data: rooms } = await supabase.from('rooms').select('id, name, status, base_price').limit(10)
    console.log('2. ROOMS:', rooms?.length, 'total -', rooms?.filter(r => r.status === 'available').length, 'available')

    // 3. Support tickets JOIN works (the fix!)
    const { data: ticketsJoin, error: tjErr } = await supabase
        .from('support_tickets')
        .select('*, profiles:user_id(full_name, email)')
        .limit(3)
    console.log('3. TICKETS+PROFILES JOIN:', ticketsJoin?.length, 'found', tjErr ? `ERROR: ${tjErr.message}` : 'OK')
    if (ticketsJoin?.[0]) console.log('   Profile:', ticketsJoin[0].profiles?.full_name, ticketsJoin[0].profiles?.email)

    // 4. Messages JOIN works
    const { data: msgsJoin, error: mjErr } = await supabase
        .from('ticket_messages')
        .select('*, profiles:sender_id(full_name)')
        .limit(3)
    console.log('4. MESSAGES+PROFILES JOIN:', msgsJoin?.length, 'found', mjErr ? `ERROR: ${mjErr.message}` : 'OK')

    // 5. Loyalty tiers
    const { data: tiers } = await supabase.from('loyalty_tiers').select('*').limit(5)
    console.log('5. LOYALTY TIERS:', tiers?.length, 'found')

    // 6. Loyalty rewards
    const { data: rewards } = await supabase.from('loyalty_rewards').select('*').limit(5)
    console.log('6. LOYALTY REWARDS:', rewards?.length, 'found')

    // 7. Test banner insert
    const hotelId = hotels?.[0]?.id
    if (hotelId) {
        const { data: banner, error: bErr } = await supabase
            .from('banners')
            .insert({ hotel_id: hotelId, title: 'Verify Test', position: 1 })
            .select()
            .single()
        console.log('7. BANNER INSERT:', banner ? 'SUCCESS' : 'FAILED', bErr ? `ERROR: ${bErr.message}` : '')
        if (banner) {
            await supabase.from('banners').delete().eq('id', banner.id)
            console.log('   (cleaned up test banner)')
        }
    }

    // 8. Test loyalty points insert
    if (hotelId) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
        const userId = profiles?.[0]?.id
        if (userId) {
            const { data: lp, error: lpErr } = await supabase
                .from('loyalty_points')
                .insert({ user_id: userId, hotel_id: hotelId, points: 100, type: 'adjusted', description: 'Verify test', balance_after: 100 })
                .select()
                .single()
            console.log('8. LOYALTY POINTS INSERT:', lp ? 'SUCCESS' : 'FAILED', lpErr ? `ERROR: ${lpErr.message}` : '')
            if (lp) {
                await supabase.from('loyalty_points').delete().eq('id', lp.id)
                console.log('   (cleaned up test points)')
            }
        }
    }

    // 9. Check bookings table column (guest_id vs user_id)
    const { data: bCols, error: bErr2 } = await supabase.from('bookings').select('*').limit(0)
    console.log('9. BOOKINGS TABLE:', bErr2 ? `ERROR: ${bErr2.message}` : 'OK')

    // Try inserting a test with guest_id to see if column exists
    const { error: testErr } = await supabase
        .from('bookings')
        .insert({ hotel_id: hotelId, room_id: rooms?.[0]?.id, guest_id: '3b0fb557-d508-45c3-ae3a-20652015d746', check_in: '2026-03-01', check_out: '2026-03-02', total_amount: 100 })
        .select()
        .single()
    console.log('   - guest_id column:', testErr ? `ERROR: ${testErr.message}` : 'EXISTS')

    console.log('\n=== DONE ===')
}

verify().catch(console.error)
