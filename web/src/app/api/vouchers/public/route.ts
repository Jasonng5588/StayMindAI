import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Public active promo codes (no auth required — guests can see available deals)
export async function GET() {
    try {
        const admin = createAdminClient()
        const now = new Date().toISOString()

        const { data, error } = await admin
            .from('promo_codes')
            .select('id, code, discount_type, discount_value, description, valid_to, used_count, usage_limit')
            .eq('is_active', true)
            .or(`valid_to.is.null,valid_to.gte.${now}`)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ codes: data || [] })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
