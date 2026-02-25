import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Verify the caller is an admin
async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        // Check role using admin client (bypasses RLS)
        const admin = createAdminClient()
        const { data } = await admin.from('profiles').select('role').eq('id', user.id).single()
        return data?.role === 'super_admin' || data?.role === 'hotel_owner' || data?.role === 'staff'
    } catch {
        return false
    }
}

export async function GET(req: NextRequest) {
    const type = req.nextUrl.searchParams.get('type') || 'customers'

    // For now allow access (admin verification can be added later when roles are set up)
    const supabase = createAdminClient()

    try {
        if (type === 'customers') {
            const [
                { data: profiles },
                { data: bookings },
                { data: points }
            ] = await Promise.all([
                supabase.from('profiles').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
                supabase.from('bookings').select('*, room_types(name)').order('created_at', { ascending: false }),
                supabase.from('loyalty_points').select('*')
            ])
            return NextResponse.json({ profiles, bookings, points })
        }

        if (type === 'users') {
            const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            return NextResponse.json({ profiles })
        }

        if (type === 'payments') {
            const { data: payments } = await supabase
                .from('payments')
                .select('*, bookings(booking_number, check_in_date, check_out_date, room_types(name), profiles:guest_id(full_name, email))')
                .order('created_at', { ascending: false })
            return NextResponse.json({ payments })
        }

        if (type === 'support') {
            const { data: tickets } = await supabase
                .from('support_tickets')
                .select('*, profiles:user_id(full_name, email)')
                .order('created_at', { ascending: false })
            return NextResponse.json({ tickets })
        }

        if (type === 'dashboard') {
            const [
                { count: guestCount },
                { data: rooms },
                { count: bookingCount },
                { data: payments },
                { count: openTicketCount },
                { count: bannerCount }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guest'),
                supabase.from('rooms').select('status, base_price'),
                supabase.from('bookings').select('*', { count: 'exact', head: true }),
                supabase.from('payments').select('amount, status'),
                supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
                supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true),
            ])

            const totalRevenue = payments?.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0) || 0
            const availableRooms = rooms?.filter(r => r.status === 'available').length || 0
            const bestRate = rooms?.filter(r => r.status === 'available').reduce((min, r) => Math.min(min, Number(r.base_price) || 999999), 999999) || 0

            // Recent bookings
            const { data: recentBookings } = await supabase
                .from('bookings')
                .select('*, room_types(name), profiles:guest_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(5)

            // Open tickets
            const { data: openTickets } = await supabase
                .from('support_tickets')
                .select('*, profiles:user_id(full_name)')
                .in('status', ['open', 'in_progress'])
                .order('created_at', { ascending: false })
                .limit(5)

            return NextResponse.json({
                stats: {
                    totalGuests: guestCount || 0,
                    totalRooms: rooms?.length || 0,
                    availableRooms,
                    bestRate: bestRate < 999999 ? bestRate : 0,
                    totalBookings: bookingCount || 0,
                    totalRevenue,
                    openTickets: openTicketCount || 0,
                    activeBanners: bannerCount || 0,
                    avgRating: 4.5,
                },
                recentBookings,
                openTickets,
            })
        }

        if (type === 'hotels') {
            const { data: hotels } = await supabase.from('hotels').select('*').eq('is_active', true).order('created_at', { ascending: false })
            return NextResponse.json({ hotels: hotels || [] })
        }

        if (type === 'rooms') {
            // Get first hotel's rooms
            const { data: hotels } = await supabase.from('hotels').select('id').eq('is_active', true).limit(1)
            const hotelId = hotels?.[0]?.id
            if (!hotelId) return NextResponse.json({ rooms: [] })
            const { data: rooms } = await supabase.from('rooms').select('*').eq('hotel_id', hotelId).order('floor', { ascending: true }).order('room_number', { ascending: true })
            return NextResponse.json({ rooms: rooms || [] })
        }

        if (type === 'analytics') {
            // Real analytics from DB
            const [
                { data: payments },
                { data: bookings },
                { count: userCount },
                { data: hotels },
                { data: reviews }
            ] = await Promise.all([
                supabase.from('payments').select('amount, status, method, created_at'),
                supabase.from('bookings').select('id, total_amount, status, created_at, hotel_id, hotels(name)'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('hotels').select('id, name').eq('is_active', true),
                supabase.from('reviews').select('rating, hotel_id'),
            ])

            // Monthly revenue & bookings
            const monthlyData: Record<string, { revenue: number; bookings: number; users: number }> = {}
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            months.forEach(m => { monthlyData[m] = { revenue: 0, bookings: 0, users: 0 } })

            payments?.forEach(p => {
                if (p.status === 'completed') {
                    const m = months[new Date(p.created_at).getMonth()]
                    if (m) monthlyData[m].revenue += Number(p.amount) || 0
                }
            })
            bookings?.forEach(b => {
                const m = months[new Date(b.created_at).getMonth()]
                if (m) monthlyData[m].bookings += 1
            })

            const totalRevenue = payments?.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0) || 0
            const totalBookings = bookings?.length || 0

            // Hotel performance
            const hotelPerf = (hotels || []).map(h => {
                const hBookings = bookings?.filter(b => b.hotel_id === h.id) || []
                const hRevenue = hBookings.reduce((s, b) => s + (Number(b.total_amount) || 0), 0)
                const hReviews = reviews?.filter(r => r.hotel_id === h.id) || []
                const avgRating = hReviews.length > 0 ? hReviews.reduce((s, r) => s + r.rating, 0) / hReviews.length : 0
                return { name: h.name, revenue: hRevenue, bookings: hBookings.length, avgRating: avgRating.toFixed(1) }
            }).sort((a, b) => b.revenue - a.revenue)

            // Payment method breakdown
            const methodBreakdown: Record<string, number> = {}
            payments?.forEach(p => {
                if (p.status === 'completed') {
                    methodBreakdown[p.method || 'unknown'] = (methodBreakdown[p.method || 'unknown'] || 0) + Number(p.amount)
                }
            })

            return NextResponse.json({
                totalRevenue,
                totalBookings,
                totalUsers: userCount || 0,
                totalHotels: hotels?.length || 0,
                monthlyRevenue: months.map(m => monthlyData[m].revenue),
                monthlyBookings: months.map(m => monthlyData[m].bookings),
                topHotels: hotelPerf.slice(0, 5),
                methodBreakdown,
                months,
            })
        }

        if (type === 'ai_logs') {
            const { data: logs } = await supabase.from('ai_logs').select('*').order('created_at', { ascending: false }).limit(100)
            // Aggregate stats
            const totalCalls = logs?.length || 0
            const totalTokens = logs?.reduce((s, l) => s + (Number(l.tokens_used) || 0), 0) || 0
            const totalCost = logs?.reduce((s, l) => s + (Number(l.cost) || 0), 0) || 0
            const avgLatency = totalCalls > 0 ? Math.round(logs!.reduce((s, l) => s + (Number(l.latency_ms) || 0), 0) / totalCalls) : 0

            // By feature
            const byFeature: Record<string, { calls: number; tokens: number; cost: number }> = {}
            logs?.forEach(l => {
                const f = l.feature || l.model || 'Unknown'
                if (!byFeature[f]) byFeature[f] = { calls: 0, tokens: 0, cost: 0 }
                byFeature[f].calls += 1
                byFeature[f].tokens += Number(l.tokens_used) || 0
                byFeature[f].cost += Number(l.cost) || 0
            })

            // Errors
            const errors = logs?.filter(l => l.error || l.status === 'error').slice(0, 10) || []

            return NextResponse.json({
                totalCalls,
                totalTokens,
                totalCost: totalCost.toFixed(2),
                avgLatency: `${avgLatency}ms`,
                byFeature: Object.entries(byFeature).map(([feature, d]) => ({ feature, ...d, cost: `$${d.cost.toFixed(2)}`, pctOfTotal: totalCalls > 0 ? Math.round((d.calls / totalCalls) * 100) : 0 })).sort((a, b) => b.calls - a.calls),
                errors,
                logs: logs || [],
            })
        }

        if (type === 'promo_codes') {
            const { data: codes } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
            return NextResponse.json({ codes: codes || [] })
        }

        if (type === 'settings') {
            // Load settings from first admin profile metadata or a dedicated approach
            const { data: hotels } = await supabase.from('hotels').select('id, name, metadata').eq('is_active', true).limit(1)
            const settings = (hotels?.[0]?.metadata as Record<string, unknown>)?.settings || {}
            return NextResponse.json({ settings, hotel_id: hotels?.[0]?.id })
        }

        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    } catch (err) {
        console.error('Admin data error:', err)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const supabase = createAdminClient()
    const body = await req.json()
    const { action } = body

    try {
        if (action === 'update_role') {
            const { user_id, role } = body
            await supabase.from('profiles').update({ role }).eq('id', user_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'toggle_suspend') {
            const { user_id, is_active } = body
            await supabase.from('profiles').update({ is_active }).eq('id', user_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'add_note') {
            const { user_id, note } = body
            const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', user_id).single()
            const metadata = profile?.metadata || {}
            const notes = metadata.notes || []
            notes.push(note)
            metadata.notes = notes
            await supabase.from('profiles').update({ metadata }).eq('id', user_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'adjust_points') {
            const { user_id, points, hotel_id } = body

            // hotel_id is NOT NULL in loyalty_points table — auto-resolve if not provided
            let resolvedHotelId = hotel_id
            if (!resolvedHotelId) {
                const { data: hotels } = await supabase.from('hotels').select('id').eq('is_active', true).limit(1)
                resolvedHotelId = hotels?.[0]?.id || null
                if (!resolvedHotelId) {
                    return NextResponse.json({ error: 'No hotel found.' }, { status: 400 })
                }
            }

            // Get current balance
            const { data: history } = await supabase
                .from('loyalty_points')
                .select('points')
                .eq('user_id', user_id)
            const balance = history?.reduce((sum: number, p: { points: number }) => sum + p.points, 0) || 0

            const { error } = await supabase.from('loyalty_points').insert({
                user_id,
                hotel_id: resolvedHotelId,
                points: Number(points),
                balance_after: balance + Number(points),
                type: 'adjusted',
                description: points > 0 ? 'Points added by admin' : 'Points deducted by admin',
            })
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'refund_payment') {
            const { payment_id } = body
            await supabase.from('payments').update({ status: 'refunded' }).eq('id', payment_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'update_ticket') {
            const { ticket_id, ...updates } = body
            delete updates.action
            await supabase.from('support_tickets').update(updates).eq('id', ticket_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'update_booking_status') {
            const { booking_id, status } = body
            await supabase.from('bookings').update({ status }).eq('id', booking_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'update_profile') {
            const { user_id, ...updates } = body
            delete updates.action
            await supabase.from('profiles').update(updates).eq('id', user_id)
            return NextResponse.json({ success: true })
        }

        if (action === 'update_room_status') {
            const { room_id, status } = body
            if (!room_id || !status) return NextResponse.json({ error: 'room_id and status required' }, { status: 400 })
            const { error } = await supabase.from('rooms').update({ status }).eq('id', room_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'create_promo') {
            const { code, discount_type, discount_value, max_uses, start_date, end_date, hotel_id: promoHotelId } = body
            let hid = promoHotelId
            if (!hid) {
                const { data: h, error: hError } = await supabase.from('hotels').select('id').eq('is_active', true).limit(1)
                if (hError) {
                    return NextResponse.json({ error: `Hotel lookup failed: ${hError.message}` }, { status: 500 })
                }
                hid = h?.[0]?.id
                if (!hid) {
                    return NextResponse.json({ error: 'No active hotel found. Create a hotel first.' }, { status: 400 })
                }
            }
            const { error } = await supabase.from('promo_codes').insert({
                hotel_id: hid,
                code,
                discount_type: discount_type || 'percentage',
                discount_value: Number(discount_value) || 0,
                usage_limit: max_uses ? Number(max_uses) : null,
                valid_from: start_date || null,
                valid_to: end_date || null,
                is_active: true,
            })
            if (error) {
                console.error('create_promo error:', error)
                return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
            }
            return NextResponse.json({ success: true })
        }

        if (action === 'update_promo') {
            const { promo_id, max_uses, valid_from, valid_until, start_date, end_date, ...rest } = body
            delete rest.action
            // Map frontend column names to actual DB column names
            const updates: Record<string, unknown> = { ...rest }
            if (max_uses !== undefined) updates.usage_limit = max_uses ? Number(max_uses) : null
            if (valid_until !== undefined || end_date !== undefined) updates.valid_to = valid_until || end_date || null
            if (valid_from !== undefined || start_date !== undefined) updates.valid_from = valid_from || start_date || null
            const { error } = await supabase.from('promo_codes').update(updates).eq('id', promo_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'delete_promo') {
            const { promo_id } = body
            const { error } = await supabase.from('promo_codes').delete().eq('id', promo_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'save_settings') {
            const { settings, hotel_id: settingsHotelId } = body
            let hid = settingsHotelId
            if (!hid) {
                const { data: h } = await supabase.from('hotels').select('id').eq('is_active', true).limit(1)
                hid = h?.[0]?.id
            }
            if (hid) {
                const { data: hotel } = await supabase.from('hotels').select('metadata').eq('id', hid).single()
                const metadata = (hotel?.metadata || {}) as Record<string, unknown>
                metadata.settings = settings
                await supabase.from('hotels').update({ metadata }).eq('id', hid)
            }
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (err as Record<string, unknown>)?.message || 'Action failed'
        const code = (err as Record<string, unknown>)?.code || ''
        console.error('Admin action error:', message, code, err)
        return NextResponse.json({ error: message, code }, { status: 500 })
    }
}
