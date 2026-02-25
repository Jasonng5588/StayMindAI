import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Check room availability
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { hotel_id, check_in, check_out, room_type_id: room_type } = await request.json()

        if (!hotel_id || !check_in || !check_out) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get all rooms of the requested type
        let roomQuery = supabase.from('rooms').select('id, room_number, floor').eq('hotel_id', hotel_id).eq('status', 'available')
        if (room_type) roomQuery = roomQuery.eq('room_type', room_type)
        const { data: allRooms, error: roomErr } = await roomQuery
        if (roomErr) throw roomErr

        // Get booked rooms for the date range
        const { data: bookedBookings } = await supabase
            .from('bookings')
            .select('room_id')
            .eq('hotel_id', hotel_id)
            .in('status', ['confirmed', 'checked_in'])
            .lte('check_in', check_out)
            .gte('check_out', check_in)

        const bookedRoomIds = new Set((bookedBookings ?? []).map(b => b.room_id))
        const availableRooms = (allRooms ?? []).filter(r => !bookedRoomIds.has(r.id))

        return NextResponse.json({
            available: availableRooms.length > 0,
            total_rooms: allRooms?.length ?? 0,
            available_rooms: availableRooms,
            booked_rooms: bookedRoomIds.size,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Availability check failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
