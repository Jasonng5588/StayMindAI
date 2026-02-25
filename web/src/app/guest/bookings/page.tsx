"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, MapPin, Clock, XCircle, Loader2, BedDouble } from 'lucide-react'

interface Booking {
    id: string; room: string; check_in: string; check_out: string
    nights: number; guests: number; total: number; status: string; booking_number: string
}

const statusColors: Record<string, string> = {
    confirmed: 'success', pending: 'warning', cancelled: 'destructive',
    checked_in: 'default', checked_out: 'secondary', no_show: 'destructive'
}

export default function GuestBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
    const [cancelling, setCancelling] = useState<string | null>(null)

    useEffect(() => { fetchBookings() }, [])

    const fetchBookings = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/bookings')
            if (!res.ok) { setLoading(false); return }
            const { bookings: data } = await res.json()

            if (data) {
                setBookings(data.map((b: Record<string, unknown>) => ({
                    id: b.id as string,
                    room: (b.rooms as { name?: string })?.name || 'Room',
                    check_in: b.check_in as string,
                    check_out: b.check_out as string,
                    nights: Math.ceil((new Date(b.check_out as string).getTime() - new Date(b.check_in as string).getTime()) / 86400000),
                    guests: (b.guests as number) || 1,
                    total: Number(b.total_amount),
                    status: b.status as string,
                    booking_number: (b.booking_number as string) || (b.id as string).slice(0, 8),
                })))
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const cancelBooking = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return
        setCancelling(id)
        try {
            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_booking_status', booking_id: id, status: 'cancelled' })
            })
            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
            }
        } catch (err) { console.error(err) }
        setCancelling(null)
    }

    const today = new Date().toISOString().split('T')[0]
    const upcoming = bookings.filter(b => b.check_in >= today && b.status !== 'cancelled' && b.status !== 'checked_out')
    const past = bookings.filter(b => b.check_in < today || b.status === 'cancelled' || b.status === 'checked_out')

    const displayed = tab === 'upcoming' ? upcoming : past

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading bookings...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><CalendarCheck className="h-5 w-5 text-emerald-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
                    <p className="text-muted-foreground">{bookings.length} total bookings</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant={tab === 'upcoming' ? 'default' : 'outline'} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</Button>
                <Button variant={tab === 'past' ? 'default' : 'outline'} onClick={() => setTab('past')}>Past ({past.length})</Button>
            </div>

            {displayed.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <BedDouble className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No {tab} bookings</h3>
                    <p className="text-muted-foreground mb-4">{tab === 'upcoming' ? 'Book a room to get started!' : 'Your past bookings will appear here'}</p>
                    {tab === 'upcoming' && <Button asChild><a href="/guest/rooms">Book a Room</a></Button>}
                </CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {displayed.map(b => (
                        <Card key={b.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg">{b.room}</h3>
                                            <Badge variant={statusColors[b.status] as 'success' | 'warning' | 'destructive' | 'secondary' | 'default'}>{b.status.replace('_', ' ')}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-mono">#{b.booking_number}</p>
                                    </div>
                                    <p className="text-xl font-bold">RM {b.total.toFixed(2)}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Check-in</p><p className="font-medium">{b.check_in}</p></div></div>
                                    <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Check-out</p><p className="font-medium">{b.check_out}</p></div></div>
                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Duration</p><p className="font-medium">{b.nights} night{b.nights > 1 ? 's' : ''}</p></div></div>
                                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Guests</p><p className="font-medium">{b.guests}</p></div></div>
                                </div>
                                {tab === 'upcoming' && (b.status === 'confirmed' || b.status === 'pending') && (
                                    <div className="mt-4 pt-3 border-t flex justify-end">
                                        <Button variant="destructive" size="sm" onClick={() => cancelBooking(b.id)} disabled={cancelling === b.id}>
                                            {cancelling === b.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}Cancel Booking
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
