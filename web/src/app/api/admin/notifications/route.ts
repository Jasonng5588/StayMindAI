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
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (userId) query = query.eq('user_id', userId)

        const { data, error } = await query
        if (error) throw error

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
        if (id) await admin.from('notifications').delete().eq('id', id)
        else if (user_id) await admin.from('notifications').delete().eq('user_id', user_id)
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
            .insert({ user_id, type: type || 'info', title, message, action_url: action_url || null, metadata: metadata || {} })
            .select()
            .single()
        if (error) throw error
        return NextResponse.json({ notification: data }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send notification'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
