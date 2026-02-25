import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: List banners
export async function GET(request: Request) {
    try {
        const admin = createAdminClient()

        const { searchParams } = new URL(request.url)
        const hotel_id = searchParams.get('hotel_id')
        const active_only = searchParams.get('active_only') === 'true'

        let query = admin.from('banners').select('*')
        if (hotel_id) query = query.eq('hotel_id', hotel_id)
        if (active_only) query = query.eq('is_active', true)
        query = query.order('position', { ascending: true })

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ banners: data || [] })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch banners'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST: Create a new banner
export async function POST(request: Request) {
    try {
        const body = await request.json()
        let { hotel_id, title, subtitle, image_url, link_url, start_date, end_date, position = 0 } = body

        if (!title) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // hotel_id is NOT NULL — auto-resolve if not provided
        if (!hotel_id) {
            const { data: hotels } = await admin.from('hotels').select('id').eq('is_active', true).limit(1)
            hotel_id = hotels?.[0]?.id || null
            if (!hotel_id) {
                return NextResponse.json({ error: 'No hotel found. Please create a hotel first.' }, { status: 400 })
            }
        }

        const { data, error } = await admin
            .from('banners')
            .insert({ hotel_id, title, subtitle, image_url, link_url, start_date: start_date || null, end_date: end_date || null, position })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ banner: data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create banner'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// PATCH: Update a banner
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, banner_id, ...updates } = body
        const bid = banner_id || id

        if (!bid) return NextResponse.json({ error: 'id or banner_id is required' }, { status: 400 })

        const admin = createAdminClient()
        const { data, error } = await admin
            .from('banners')
            .update(updates)
            .eq('id', bid)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ banner: data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update banner'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE: Remove a banner
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const banner_id = searchParams.get('banner_id') || searchParams.get('id')
        if (!banner_id) return NextResponse.json({ error: 'banner_id is required' }, { status: 400 })

        const admin = createAdminClient()
        const { error } = await admin
            .from('banners')
            .delete()
            .eq('id', banner_id)

        if (error) throw error
        return NextResponse.json({ deleted: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete banner'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
