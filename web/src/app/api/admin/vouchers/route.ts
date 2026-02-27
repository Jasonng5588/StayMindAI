import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Admin sends a personal voucher to a specific guest
export async function POST(request: Request) {
    try {
        const { user_id, user_email, code, discount_type, discount_value, description, expires_at, promo_code_id } = await request.json()
        if (!user_id || !code || !discount_value) {
            return NextResponse.json({ error: 'user_id, code, discount_value are required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Insert user_voucher
        const { data, error } = await admin
            .from('user_vouchers')
            .insert({
                user_id,
                promo_code_id: promo_code_id || null,
                code: code.toUpperCase().trim(),
                discount_type: discount_type || 'percentage',
                discount_value: Number(discount_value),
                description: description || null,
                expires_at: expires_at || null,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ voucher: data }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send voucher'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// GET: Admin gets all user vouchers (to view who has what)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')

        const admin = createAdminClient()
        let query = admin
            .from('user_vouchers')
            .select('*, profiles:user_id(full_name, email)')
            .order('created_at', { ascending: false })

        if (userId) query = query.eq('user_id', userId)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ vouchers: data || [] })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// DELETE: Revoke a user voucher
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()
        const admin = createAdminClient()
        const { error } = await admin.from('user_vouchers').delete().eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
