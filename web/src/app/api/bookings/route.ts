import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Create a new booking
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { hotel_id, room_id, check_in, check_out, guests, total_amount, special_requests, promo_code } = body

        // Validate required fields
        if (!hotel_id || !room_id || !check_in || !check_out) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Check room availability (overbooking prevention)
        const { data: overlapping, error: overlapErr } = await admin
            .from('bookings')
            .select('id')
            .eq('room_id', room_id)
            .in('status', ['confirmed', 'checked_in'])
            .lte('check_in', check_out)
            .gte('check_out', check_in)

        if (overlapErr) throw overlapErr
        if (overlapping && overlapping.length > 0) {
            return NextResponse.json({ error: 'Room is not available for the selected dates' }, { status: 409 })
        }

        // Validate promo code if provided
        let discount = 0
        if (promo_code) {
            const { data: promo } = await admin
                .from('promo_codes')
                .select('*')
                .eq('code', promo_code.toUpperCase())
                .eq('hotel_id', hotel_id)
                .eq('is_active', true)
                .gte('valid_to', new Date().toISOString().split('T')[0])
                .lte('valid_from', new Date().toISOString().split('T')[0])
                .single()

            if (promo) {
                if (promo.max_uses && promo.current_uses >= promo.max_uses) {
                    return NextResponse.json({ error: 'Promo code has reached maximum uses' }, { status: 400 })
                }
                discount = promo.discount_type === 'percentage'
                    ? total_amount * (promo.discount_value / 100)
                    : promo.discount_value

                // Increment usage
                await admin.from('promo_codes').update({ current_uses: promo.current_uses + 1 }).eq('id', promo.id)
            } else {
                return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 })
            }
        }

        const finalAmount = total_amount - discount

        // Generate booking confirmation code
        const confirmCode = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        // Create booking
        const { data: booking, error: bookingErr } = await admin
            .from('bookings')
            .insert({
                hotel_id,
                user_id: user.id,
                room_id,
                check_in,
                check_out,
                guests: guests || 1,
                total_amount: finalAmount,
                status: 'confirmed',
                special_requests,
                booking_number: confirmCode,
            })
            .select()
            .single()

        if (bookingErr) throw bookingErr

        // Create payment record (non-blocking)
        try {
            await admin.from('payments').insert({
                booking_id: booking.id,
                amount: finalAmount,
                currency: 'MYR',
                method: 'card',
                status: 'completed',
            })
        } catch { /* non-critical */ }

        // Create notification (non-blocking)
        try {
            await admin.from('notifications').insert({
                user_id: user.id,
                hotel_id,
                type: 'booking',
                title: 'Booking Confirmed',
                message: `Your booking ${confirmCode} is confirmed for ${check_in} to ${check_out}`,
            })
        } catch { /* non-critical */ }

        return NextResponse.json({
            booking,
            confirmation_code: confirmCode,
            discount,
            final_amount: finalAmount,
        }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Booking creation failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// GET: List bookings (for the current user or hotel owner)
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const hotelId = searchParams.get('hotel_id')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') ?? '1')
        const limit = parseInt(searchParams.get('limit') ?? '20')

        const admin = createAdminClient()
        let query = admin.from('bookings').select('*, rooms(room_number, name)', { count: 'exact' })

        if (hotelId) {
            query = query.eq('hotel_id', hotelId)
        } else {
            query = query.eq('user_id', user.id)
        }

        if (status) query = query.eq('status', status)
        query = query.order('created_at', { ascending: false })
        query = query.range((page - 1) * limit, page * limit - 1)

        const { data, count, error } = await query
        if (error) throw error

        return NextResponse.json({ bookings: data, total: count, page, limit })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch bookings'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

