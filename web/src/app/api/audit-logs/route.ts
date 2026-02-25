import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch audit logs (super admin only)
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify super admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') ?? '1')
        const limit = parseInt(searchParams.get('limit') ?? '50')
        const action = searchParams.get('action')
        const userId = searchParams.get('user_id')

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (action) query = query.eq('action', action)
        if (userId) query = query.eq('user_id', userId)

        const { data, count, error } = await query
        if (error) throw error

        return NextResponse.json({ logs: data, total: count, page, limit })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch audit logs'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST: Create an audit log entry
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action, entity_type, entity_id, details, hotel_id } = await request.json()

        const { error } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            action,
            entity_type,
            entity_id,
            details,
            hotel_id,
            ip_address: request.headers.get('x-forwarded-for') ?? 'unknown',
        })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create audit log'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
