import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion })

// POST: Handle Stripe webhook events
export async function POST(request: Request) {
    try {
        const body = await request.text()
        const sig = request.headers.get('stripe-signature')
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        let event: Stripe.Event

        if (webhookSecret && sig) {
            event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
        } else {
            event = JSON.parse(body, (key, value) => {
                if (key === 'created') return value
                return value
            }) as Stripe.Event
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const bookingId = session.metadata?.booking_id
                if (bookingId) {
                    const supabase = await createClient()
                    await supabase.from('payments').update({
                        status: 'completed',
                        transaction_id: session.payment_intent as string,
                    }).eq('booking_id', bookingId)

                    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
                }
                break
            }

            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge
                const supabase = await createClient()
                if (charge.payment_intent) {
                    await supabase.from('payments').update({ status: 'refunded' }).eq('transaction_id', charge.payment_intent)
                }
                break
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                const bookingId = paymentIntent.metadata?.booking_id
                if (bookingId) {
                    const supabase = await createClient()
                    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
                    await supabase.from('payments').update({ status: 'failed' }).eq('booking_id', bookingId)
                }
                break
            }

            // Subscription events for SaaS billing
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription & Record<string, unknown>
                const supabase = await createClient()
                try {
                    await supabase.from('subscriptions').upsert({
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer as string,
                        status: subscription.status,
                        current_period_start: new Date((subscription.current_period_start as number) * 1000).toISOString(),
                        current_period_end: new Date((subscription.current_period_end as number) * 1000).toISOString(),
                    }, { onConflict: 'stripe_subscription_id' })
                } catch { /* non-critical */ }
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const supabase = await createClient()
                try {
                    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', subscription.id)
                } catch { /* non-critical */ }
                break
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice
                const supabase = await createClient()
                try {
                    await supabase.from('invoices').insert({
                        stripe_invoice_id: invoice.id,
                        stripe_customer_id: invoice.customer as string,
                        amount: (invoice.amount_paid ?? 0) / 100,
                        currency: invoice.currency,
                        status: 'paid',
                        pdf_url: invoice.invoice_pdf ?? null,
                    })
                } catch { /* non-critical */ }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Webhook handling failed'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
