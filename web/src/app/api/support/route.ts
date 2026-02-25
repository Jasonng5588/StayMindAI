import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Create a support ticket
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { subject, description, category, priority = 'medium', hotel_id, user_id } = body

        if (!subject || !description) {
            return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Get a user_id: use provided or get first guest
        let resolvedUserId = user_id
        if (!resolvedUserId) {
            const { data: profiles } = await admin.from('profiles').select('id').eq('role', 'guest').limit(1)
            resolvedUserId = profiles?.[0]?.id
        }

        const { data: ticket, error } = await admin
            .from('support_tickets')
            .insert({
                user_id: resolvedUserId,
                hotel_id: hotel_id || null,
                subject,
                description,
                category,
                priority,
                status: 'open',
            })
            .select()
            .single()

        if (error) throw error

        // Create initial message in ticket thread
        if (resolvedUserId) {
            await admin.from('ticket_messages').insert({
                ticket_id: ticket.id,
                sender_id: resolvedUserId,
                role: 'guest',
                message: description,
            })
        }

        return NextResponse.json({ ticket }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create ticket'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// GET: List support tickets
export async function GET() {
    try {
        const admin = createAdminClient()
        const { data, count, error } = await admin
            .from('support_tickets')
            .select('*, profiles:user_id(full_name, email)', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ tickets: data, total: count })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch tickets'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// PATCH: Update ticket status / assign / resolve
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { ticket_id, status, priority, assigned_to, resolution } = body

        if (!ticket_id) return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })

        const updateData: Record<string, unknown> = {}
        if (status) updateData.status = status
        if (priority) updateData.priority = priority
        if (assigned_to) updateData.assigned_to = assigned_to
        if (resolution) {
            updateData.resolution = resolution
            updateData.resolved_at = new Date().toISOString()
        }

        const admin = createAdminClient()
        const { data: ticket, error } = await admin
            .from('support_tickets')
            .update(updateData)
            .eq('id', ticket_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ ticket })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update ticket'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
