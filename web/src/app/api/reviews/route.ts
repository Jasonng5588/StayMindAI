import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: List reviews for the current user
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createAdminClient()
        const { data: reviews, error } = await admin
            .from('reviews')
            .select('*, hotels(name)')
            .eq('guest_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ reviews: reviews || [] })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch reviews'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST: Create a new review
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { hotel_id, booking_id, rating, title, comment } = body

        if (!rating || !comment) {
            return NextResponse.json({ error: 'Rating and comment are required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Resolve hotel_id if not provided
        let resolvedHotelId = hotel_id
        if (!resolvedHotelId) {
            const { data: hotels } = await admin.from('hotels').select('id').eq('is_active', true).limit(1)
            resolvedHotelId = hotels?.[0]?.id
            if (!resolvedHotelId) return NextResponse.json({ error: 'No hotel found' }, { status: 400 })
        }

        const { data: review, error } = await admin
            .from('reviews')
            .insert({
                hotel_id: resolvedHotelId,
                booking_id: booking_id || null,
                guest_id: user.id,
                rating,
                title: title || null,
                comment,
            })
            .select('*, hotels(name)')
            .single()

        if (error) throw error

        return NextResponse.json({ review }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create review'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// PATCH: Update a review
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, rating, comment } = body

        if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 })

        const admin = createAdminClient()
        const { error } = await admin
            .from('reviews')
            .update({ rating, comment, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('guest_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update review'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE: Soft-delete a review
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 })

        const admin = createAdminClient()
        const { error } = await admin
            .from('reviews')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('guest_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete review'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
