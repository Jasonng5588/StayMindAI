import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Send a message in a ticket thread
export async function POST(request: Request) {
    try {
        const { ticket_id, message, role = 'guest', sender_id } = await request.json()
        if (!ticket_id || !message) {
            return NextResponse.json({ error: 'ticket_id and message are required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Resolve sender_id: use provided or try to get from ticket
        let resolvedSenderId = sender_id
        if (!resolvedSenderId) {
            const { data: ticket } = await admin.from('support_tickets').select('user_id').eq('id', ticket_id).single()
            resolvedSenderId = ticket?.user_id
        }
        if (!resolvedSenderId) {
            return NextResponse.json({ error: 'sender_id is required' }, { status: 400 })
        }

        const { data, error } = await admin
            .from('ticket_messages')
            .insert({
                ticket_id,
                sender_id: resolvedSenderId,
                role,
                message,
            })
            .select()
            .single()

        if (error) throw error

        // Update ticket status to in_progress if admin replied
        if (role === 'admin') {
            await admin.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticket_id).eq('status', 'open')
        }

        return NextResponse.json({ message: data }, { status: 201 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send message'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// GET: Get messages for a ticket
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const ticket_id = searchParams.get('ticket_id')
        if (!ticket_id) return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })

        const admin = createAdminClient()
        const { data, error } = await admin
            .from('ticket_messages')
            .select('*, profiles:sender_id(full_name)')
            .eq('ticket_id', ticket_id)
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json({ messages: data })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch messages'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
