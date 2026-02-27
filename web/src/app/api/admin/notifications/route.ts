import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Admin gets all notifications (with pagination)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')
        const limit = parseInt(searchParams.get('limit') ?? '100')

        const admin = createAdminClient()
        let query = admin
            .from('notifications')
            .select('*, profiles:user_id(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (userId) query = query.eq('user_id', userId)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ notifications: data || [] })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// DELETE: Admin deletes notification(s)
export async function DELETE(request: Request) {
    try {
        const { id, user_id } = await request.json()
        const admin = createAdminClient()
        if (id) {
            const { error } = await admin.from('notifications').delete().eq('id', id)
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        } else if (user_id) {
            const { error } = await admin.from('notifications').delete().eq('user_id', user_id)
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST: Admin sends a notification to a specific user
export async function POST(request: Request) {
    try {
        const { user_id, type, title, message, action_url, metadata } = await request.json()
        if (!user_id || !title || !message) {
            return NextResponse.json({ error: 'user_id, title, message required' }, { status: 400 })
        }
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('notifications')
            .insert({
                user_id,
                type: type || 'info',
                title,
                message,
                action_url: action_url || null,
                metadata: metadata || null,   // null is safer than {} for JSONB
            })
            .select()
            .single()
        if (error) {
            console.error('[admin/notifications POST] DB error:', JSON.stringify(error))
            return NextResponse.json({ error: error.message || error.details || 'DB error' }, { status: 500 })
        }
        return NextResponse.json({ notification: data }, { status: 201 })
    } catch (err: unknown) {
        const raw = err as Record<string, unknown>
        const msg = raw?.message as string || 'Failed to send notification'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
