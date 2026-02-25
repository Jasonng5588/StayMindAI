import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Fetch notifications for the current user
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unread') === 'true'
        const limit = parseInt(searchParams.get('limit') ?? '20')

        const admin = createAdminClient()

        let query = admin
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (unreadOnly) query = query.eq('is_read', false)

        const { data, count, error } = await query
        if (error) throw error

        // Also get unread count
        const { count: unreadCount } = await admin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        return NextResponse.json({ notifications: data, total: count, unread_count: unreadCount })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// PATCH: Mark notifications as read
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { notification_ids, mark_all } = await request.json()

        const admin = createAdminClient()

        if (mark_all) {
            await admin
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)
        } else if (notification_ids?.length) {
            await admin
                .from('notifications')
                .update({ is_read: true })
                .in('id', notification_ids)
                .eq('user_id', user.id)
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update notifications'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE: Delete a notification
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        const admin = createAdminClient()
        await admin.from('notifications').delete().eq('id', id).eq('user_id', user.id)

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete notification'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

