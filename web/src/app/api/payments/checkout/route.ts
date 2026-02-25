import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion })

// POST: Create a Stripe checkout session
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { booking_id, amount, currency = 'usd', hotel_name, room_name, check_in, check_out } = await request.json()

        if (!booking_id || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency,
                    product_data: {
                        name: `${hotel_name} - ${room_name}`,
                        description: `${check_in} to ${check_out}`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/bookings?success=true&booking_id=${booking_id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/bookings?cancelled=true`,
            metadata: {
                booking_id,
                user_id: user.id,
            },
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment session creation failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
