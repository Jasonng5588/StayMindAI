"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Hotel, Users, DollarSign, Star, CalendarCheck, TrendingUp, Brain, LifeBuoy, BedDouble, CheckCircle2, Wrench, Sparkles, AlertCircle, Loader2, X } from 'lucide-react'

interface DashboardStats {
    totalGuests: number; totalRooms: number; availableRooms: number
    bestRate: number; totalBookings: number; totalRevenue: number
    openTickets: number; activeBanners: number; avgRating: number
}
interface Booking {
    id: string; booking_number: string; check_in_date: string; check_out_date: string
    status: string; total_amount: number
    rooms: { name: string } | null
    profiles: { full_name: string } | null
}
interface Ticket {
    id: string; subject: string; status: string; priority: string; created_at: string
    profiles: { full_name: string } | null
}
interface Room {
    id: string; name: string; room_number: string; floor: number
    room_type: string; base_price: number
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order'
}

const statusConfig: Record<string, { color: string; label: string; text: string }> = {
    available: { color: 'bg-emerald-500', label: 'Available', text: 'text-emerald-600' },
    occupied: { color: 'bg-blue-500', label: 'Occupied', text: 'text-blue-600' },
    maintenance: { color: 'bg-orange-500', label: 'Maintenance', text: 'text-orange-600' },
    cleaning: { color: 'bg-amber-500', label: 'Cleaning', text: 'text-amber-600' },
    out_of_order: { color: 'bg-red-500', label: 'Out of Order', text: 'text-red-600' },
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentBookings, setRecentBookings] = useState<Booking[]>([])
    const [openTickets, setOpenTickets] = useState<Ticket[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    useEffect(() => { fetchDashboard() }, [])

    const fetchDashboard = async () => {
        setLoading(true)
        try {
            // Fetch dashboard stats
            const res = await fetch('/api/admin/data?type=dashboard')
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats)
                setRecentBookings(data.recentBookings || [])
                setOpenTickets(data.openTickets || [])
            }

            // Fetch rooms for room grid
            const roomRes = await fetch('/api/admin/data?type=rooms')
            if (roomRes.ok) {
                const roomData = await roomRes.json()
                setRooms(roomData.rooms || [])
            }
        } catch (err) { console.error('Dashboard fetch error:', err) }
        setLoading(false)
    }

    const updateRoomStatus = async (roomId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_room_status', room_id: roomId, status: newStatus })
            })
            if (res.ok) {
                setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus as Room['status'] } : r))
                setSelectedRoom(null)
            }
        } catch (err) { console.error(err) }
    }

    // Computed stats
    const counts = {
        available: rooms.filter(r => r.status === 'available').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
        cleaning: rooms.filter(r => r.status === 'cleaning').length,
    }
    const floors = [...new Set(rooms.map(r => r.floor))].sort()

    const occupancyRate = rooms.length > 0 ? Math.round((counts.occupied / rooms.length) * 100) : 0

    const statCards = stats ? [
        { label: 'Total Revenue', value: `RM ${stats.totalRevenue.toLocaleString()}`, trend: stats.totalRevenue > 0 ? '+12%' : '—', icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
        { label: 'Active Rooms', value: `${rooms.length}`, trend: `${counts.available} free`, icon: Hotel, color: 'text-blue-600 bg-blue-500/10' },
        { label: 'Total Guests', value: `${stats.totalGuests.toLocaleString()}`, trend: stats.totalGuests > 0 ? '+' + stats.totalGuests : '—', icon: Users, color: 'text-violet-600 bg-violet-500/10' },
        { label: 'Avg Rating', value: `${stats.avgRating}`, trend: '+0.2', icon: Star, color: 'text-amber-600 bg-amber-500/10' },
        { label: 'Bookings', value: `${stats.totalBookings}`, trend: stats.totalBookings > 0 ? '+' + stats.totalBookings : '—', icon: CalendarCheck, color: 'text-pink-600 bg-pink-500/10' },
        { label: 'Occupancy', value: `${occupancyRate}%`, trend: occupancyRate > 50 ? '↑' : '↓', icon: TrendingUp, color: 'text-cyan-600 bg-cyan-500/10' },
        { label: 'Best Rate', value: stats.bestRate > 0 ? `RM ${stats.bestRate}` : '—', trend: 'lowest', icon: Brain, color: 'text-orange-600 bg-orange-500/10' },
        { label: 'Open Tickets', value: `${stats.openTickets}`, trend: stats.openTickets > 0 ? `${stats.openTickets} pending` : 'All clear', icon: LifeBuoy, color: 'text-red-600 bg-red-500/10' },
    ] : []

    // Group rooms by type for summary
    const roomTypeSummary = rooms.reduce((acc, r) => {
        if (!acc[r.room_type]) acc[r.room_type] = { total: 0, available: 0, minPrice: Infinity }
        acc[r.room_type].total++
        if (r.status === 'available') acc[r.room_type].available++
        if (r.base_price < acc[r.room_type].minPrice) acc[r.room_type].minPrice = Number(r.base_price)
        return acc
    }, {} as Record<string, { total: number; available: number; minPrice: number }>)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">StayMind Grand Hotel — Platform Overview</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <Card key={s.label} className="hover:shadow-lg transition-all">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className={`p-2 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">{s.trend}</span>
                            </div>
                            <p className="text-2xl font-bold mt-3">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Room Availability Dashboard */}
            {rooms.length > 0 && (
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary" />Live Room Availability</h3>
                            <div className="flex gap-3">
                                {Object.entries(statusConfig).filter(([key]) => counts[key as keyof typeof counts] !== undefined).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-1.5 text-xs">
                                        <div className={`h-3 w-3 rounded-full ${val.color}`} />
                                        <span>{val.label} ({counts[key as keyof typeof counts] || 0})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Room Availability Bars */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-emerald-600">{counts.available}</p>
                                <p className="text-xs text-muted-foreground">Available</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-blue-600">{counts.occupied}</p>
                                <p className="text-xs text-muted-foreground">Occupied</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                                <Wrench className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-orange-600">{counts.maintenance}</p>
                                <p className="text-xs text-muted-foreground">Maintenance</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                                <Sparkles className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-600">{counts.cleaning}</p>
                                <p className="text-xs text-muted-foreground">Cleaning</p>
                            </div>
                        </div>

                        {/* Floor Grid */}
                        {floors.map(floor => (
                            <div key={floor} className="mb-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Floor {floor}</p>
                                <div className="flex flex-wrap gap-2">
                                    {rooms.filter(r => r.floor === floor).map(room => {
                                        const sc = statusConfig[room.status] || statusConfig.available
                                        return (
                                            <button key={room.id} onClick={() => setSelectedRoom(room)}
                                                className={`relative w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 hover:shadow-md ${room.status === 'available' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950' : room.status === 'occupied' ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : room.status === 'maintenance' ? 'border-orange-400 bg-orange-50 dark:bg-orange-950' : 'border-amber-400 bg-amber-50 dark:bg-amber-950'}`}>
                                                <span className="font-bold">{room.room_number}</span>
                                                <div className={`h-1.5 w-6 rounded-full mt-1 ${sc.color}`} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Room Action Modal */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedRoom(null)}>
                    <Card className="w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">Room {selectedRoom.room_number}</h3>
                                <Badge variant={selectedRoom.status === 'available' ? 'success' : selectedRoom.status === 'occupied' ? 'default' : 'warning'}>
                                    {(statusConfig[selectedRoom.status] || statusConfig.available).label}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{selectedRoom.room_type}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Floor</span><span>{selectedRoom.floor}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>RM {Number(selectedRoom.base_price).toLocaleString()}/night</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">Quick Actions:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={selectedRoom.status === 'available' ? 'default' : 'outline'} onClick={() => updateRoomStatus(selectedRoom.id, 'available')}>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />Available
                                </Button>
                                <Button size="sm" variant={selectedRoom.status === 'cleaning' ? 'default' : 'outline'} onClick={() => updateRoomStatus(selectedRoom.id, 'cleaning')}>
                                    <Sparkles className="h-3 w-3 mr-1" />Cleaning
                                </Button>
                                <Button size="sm" variant={selectedRoom.status === 'maintenance' ? 'default' : 'outline'} onClick={() => updateRoomStatus(selectedRoom.id, 'maintenance')}>
                                    <Wrench className="h-3 w-3 mr-1" />Maintenance
                                </Button>
                                <Button size="sm" variant={selectedRoom.status === 'occupied' ? 'default' : 'outline'} onClick={() => updateRoomStatus(selectedRoom.id, 'occupied')}>
                                    <Users className="h-3 w-3 mr-1" />Check In
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Bookings & Open Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4">Recent Bookings</h3>
                        <div className="space-y-3">
                            {recentBookings.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent bookings yet</p>
                            ) : recentBookings.map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <div>
                                        <p className="text-sm font-medium">{b.profiles?.full_name || 'Guest'} — {b.rooms?.name || 'Room'}</p>
                                        <p className="text-xs text-muted-foreground">{b.check_in_date} to {b.check_out_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">RM {Number(b.total_amount).toLocaleString()}</p>
                                        <Badge variant={b.status === 'confirmed' ? 'success' : 'secondary'} className="text-xs">{b.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4">Room Type Summary</h3>
                        <div className="space-y-3">
                            {Object.entries(roomTypeSummary).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No rooms configured yet</p>
                            ) : Object.entries(roomTypeSummary).map(([type, info]) => (
                                <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium capitalize">{type}</p>
                                        <p className="text-xs text-muted-foreground">RM {info.minPrice.toLocaleString()}/night</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-emerald-600 font-bold">{info.available}</span>
                                        <span className="text-muted-foreground text-xs">/{info.total} avail</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Open Tickets */}
            {openTickets.length > 0 && (
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />Open Support Tickets ({openTickets.length})
                        </h3>
                        <div className="space-y-2">
                            {openTickets.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                                    <div>
                                        <p className="text-sm font-medium">{t.subject}</p>
                                        <p className="text-xs text-muted-foreground">By {t.profiles?.full_name || 'Guest'} • {new Date(t.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={t.priority === 'high' || t.priority === 'critical' ? 'destructive' : 'secondary'}>{t.priority}</Badge>
                                        <Badge variant={t.status === 'open' ? 'destructive' : 'warning'}>{t.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
