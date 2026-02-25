import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Create a refund for a booking
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { booking_id, reason } = await request.json()

        if (!booking_id) {
            return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Fetch booking and cancellation policy
        const { data: booking } = await admin
            .from('bookings')
            .select('*, hotels(cancellation_policy)')
            .eq('id', booking_id)
            .single()

        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        if (booking.status === 'cancelled') return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })

        // Calculate refund based on cancellation policy
        const checkIn = new Date(booking.check_in)
        const now = new Date()
        const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60)

        let refundPercentage = 100
        if (hoursUntilCheckIn < 24) refundPercentage = 0
        else if (hoursUntilCheckIn < 48) refundPercentage = 50
        else if (hoursUntilCheckIn < 168) refundPercentage = 75 // 7 days

        const refundAmount = (booking.total_amount * refundPercentage) / 100

        // Update booking status
        await admin.from('bookings').update({
            status: 'cancelled',
            special_requests: `${booking.special_requests ?? ''}\n[CANCELLED] Reason: ${reason ?? 'Guest request'}. Refund: $${refundAmount} (${refundPercentage}%)`.trim()
        }).eq('id', booking_id)

        // Update payment record
        await admin.from('payments').update({
            status: refundPercentage === 100 ? 'refunded' : 'partially_refunded',
            metadata: { refund_amount: refundAmount, refund_percentage: refundPercentage },
        }).eq('booking_id', booking_id)

        // Notify guest (non-blocking)
        try {
            await admin.from('notifications').insert({
                user_id: booking.user_id,
                hotel_id: booking.hotel_id,
                type: 'booking',
                title: 'Booking Cancelled',
                message: `Your booking has been cancelled. Refund: $${refundAmount.toFixed(2)} (${refundPercentage}%)`,
            })
        } catch { /* non-critical */ }

        return NextResponse.json({
            refund_amount: refundAmount,
            refund_percentage: refundPercentage,
            booking_status: 'cancelled',
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Refund processing failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

