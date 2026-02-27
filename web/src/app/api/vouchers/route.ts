import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST: Validate a promo code
export async function POST(request: Request) {
    try {
        const { code, booking_amount } = await request.json()
        if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

        const admin = createAdminClient()

        // Check promo_codes table first
        const { data: promo, error: promoError } = await admin
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .eq('is_active', true)
            .single()

        if (!promoError && promo) {
            // Validate dates
            const now = new Date()
            if (promo.valid_from && new Date(promo.valid_from) > now) {
                return NextResponse.json({ error: 'This voucher is not valid yet' }, { status: 400 })
            }
            if (promo.valid_to && new Date(promo.valid_to) < now) {
                return NextResponse.json({ error: 'This voucher has expired' }, { status: 400 })
            }
            // Check usage limit
            if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
                return NextResponse.json({ error: 'This voucher has reached its usage limit' }, { status: 400 })
            }
            // Check minimum booking amount
            if (promo.min_booking_amount && booking_amount && booking_amount < promo.min_booking_amount) {
                return NextResponse.json({ error: `Minimum booking amount of RM${promo.min_booking_amount} required` }, { status: 400 })
            }
            // Calculate discount
            let discount = 0
            if (promo.discount_type === 'percentage') {
                discount = Math.round((booking_amount || 0) * (promo.discount_value / 100) * 100) / 100
            } else {
                discount = Math.min(promo.discount_value, booking_amount || promo.discount_value)
            }
            return NextResponse.json({
                valid: true,
                code: promo.code,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
                discount_amount: discount,
                description: promo.description || `${promo.discount_type === 'percentage' ? promo.discount_value + '%' : 'RM' + promo.discount_value} off`,
                voucher_id: promo.id,
                source: 'promo_code',
            })
        }

        // Check user_vouchers table (personal vouchers)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: userVoucher } = await admin
                .from('user_vouchers')
                .select('*')
                .eq('user_id', user.id)
                .eq('code', code.toUpperCase().trim())
                .eq('is_used', false)
                .single()

            if (userVoucher) {
                if (userVoucher.expires_at && new Date(userVoucher.expires_at) < new Date()) {
                    return NextResponse.json({ error: 'Your personal voucher has expired' }, { status: 400 })
                }
                let discount = 0
                if (userVoucher.discount_type === 'percentage') {
                    discount = Math.round((booking_amount || 0) * (userVoucher.discount_value / 100) * 100) / 100
                } else {
                    discount = Math.min(userVoucher.discount_value, booking_amount || userVoucher.discount_value)
                }
                return NextResponse.json({
                    valid: true,
                    code: userVoucher.code,
                    discount_type: userVoucher.discount_type,
                    discount_value: userVoucher.discount_value,
                    discount_amount: discount,
                    description: userVoucher.description || `Personal voucher: ${userVoucher.discount_type === 'percentage' ? userVoucher.discount_value + '%' : 'RM' + userVoucher.discount_value} off`,
                    voucher_id: userVoucher.id,
                    source: 'user_voucher',
                })
            }
        }

        return NextResponse.json({ error: 'Invalid or expired voucher code' }, { status: 404 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Validation failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// GET: Get user's personal vouchers
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createAdminClient()
        const { data, error } = await admin
            .from('user_vouchers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ vouchers: data || [] })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
