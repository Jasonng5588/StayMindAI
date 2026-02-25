"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Hotel, Eye, Ban, CheckCircle2, MapPin, Star, MoreHorizontal, X, BedDouble, DollarSign, Users, CalendarCheck, Wrench, Sparkles, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface RoomBreakdown { type: string; total: number; available: number; price: number }
interface HotelData {
    id: string; name: string; owner: string; email: string; location: string; rooms: number
    rating: number; status: string; revenue: number; occupancy: number
    roomBreakdown: RoomBreakdown[]
}

export default function AdminHotelsPage() {
    const [hotels, setHotels] = useState<HotelData[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [viewHotel, setViewHotel] = useState<HotelData | null>(null)

    useEffect(() => { fetchHotels() }, [])

    const fetchHotels = async () => {
        setLoading(true)
        try {
            // Fetch hotels
            const hRes = await fetch('/api/admin/data?type=hotels')
            if (!hRes.ok) { setLoading(false); return }
            const { hotels: hotelList } = await hRes.json()
            if (!hotelList || hotelList.length === 0) {
                setHotels([])
                setLoading(false)
                return
            }

            // Fetch rooms to compute per-hotel stats
            const rRes = await fetch('/api/admin/data?type=rooms')
            const { rooms: allRooms } = rRes.ok ? await rRes.json() : { rooms: [] }

            // Fetch payments for revenue
            const pRes = await fetch('/api/admin/data?type=payments')
            const { payments } = pRes.ok ? await pRes.json() : { payments: [] }

            const mapped: HotelData[] = hotelList.map((h: Record<string, unknown>) => {
                const hotelRooms = (allRooms || []).filter((r: Record<string, unknown>) => r.hotel_id === h.id)
                const totalRooms = hotelRooms.length
                const availableRooms = hotelRooms.filter((r: Record<string, unknown>) => r.status === 'available').length
                const occupiedRooms = hotelRooms.filter((r: Record<string, unknown>) => r.status === 'occupied').length
                const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

                // Group rooms by type
                const typeMap: Record<string, { total: number; available: number; minPrice: number }> = {}
                hotelRooms.forEach((r: Record<string, unknown>) => {
                    const t = r.room_type as string || 'standard'
                    if (!typeMap[t]) typeMap[t] = { total: 0, available: 0, minPrice: Infinity }
                    typeMap[t].total++
                    if (r.status === 'available') typeMap[t].available++
                    if (Number(r.base_price) < typeMap[t].minPrice) typeMap[t].minPrice = Number(r.base_price)
                })

                const roomBreakdown = Object.entries(typeMap).map(([type, info]) => ({
                    type: type.charAt(0).toUpperCase() + type.slice(1),
                    total: info.total,
                    available: info.available,
                    price: info.minPrice === Infinity ? 0 : info.minPrice,
                }))

                // Revenue from payments
                const revenue = (payments || [])
                    .filter((p: Record<string, unknown>) => p.status === 'completed')
                    .reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0)

                return {
                    id: h.id as string,
                    name: (h.name as string) || 'Hotel',
                    owner: 'Admin',
                    email: (h.email as string) || '',
                    location: `${h.city || ''}, ${h.state || ''}`.replace(/^, |, $/g, ''),
                    rooms: totalRooms,
                    rating: Number(h.star_rating) || 4.5,
                    status: (h.is_active as boolean) ? 'active' : 'suspended',
                    revenue,
                    occupancy,
                    roomBreakdown,
                }
            })

            setHotels(mapped)
        } catch (err) { console.error('Failed to fetch hotels:', err) }
        setLoading(false)
    }

    const toggleStatus = async (id: string) => {
        const hotel = hotels.find(h => h.id === id)
        if (!hotel) return
        const newActive = hotel.status !== 'active'
        try {
            // There's no direct hotel update API yet, just toggle locally
            setHotels(prev => prev.map(h => h.id === id ? { ...h, status: newActive ? 'active' : 'suspended' } : h))
        } catch (err) { console.error(err) }
    }

    const totalAvailable = (h: HotelData) => h.roomBreakdown.reduce((s, r) => s + r.available, 0)
    const totalOccupied = (h: HotelData) => h.rooms - totalAvailable(h)

    const filtered = hotels.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.owner.toLowerCase().includes(search.toLowerCase()) ||
        h.location.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading hotels...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Hotel className="h-5 w-5 text-blue-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hotel Management</h1>
                    <p className="text-muted-foreground">Room availability and hotel operations</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Hotels', value: hotels.length, color: 'text-blue-600', icon: Hotel },
                    { label: 'Total Rooms', value: hotels.reduce((s, h) => s + h.rooms, 0), color: 'text-violet-600', icon: BedDouble },
                    { label: 'Available Now', value: hotels.reduce((s, h) => s + totalAvailable(h), 0), color: 'text-emerald-600', icon: CheckCircle2 },
                    { label: 'Avg Rating', value: hotels.length > 0 ? (hotels.reduce((s, h) => s + h.rating, 0) / hotels.length).toFixed(1) : '—', color: 'text-amber-600', icon: Star },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${s.color} bg-current/10`}><s.icon className="h-5 w-5" /></div>
                            <div><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search hotels..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {filtered.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No hotels found</h3>
                    <p className="text-muted-foreground">Hotels will appear once created in the system</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(h => (
                        <Card key={h.id} className="hover:shadow-lg transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10"><Hotel className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{h.name}</h3>
                                                <Badge variant={h.status === 'active' ? 'success' : 'destructive'}>{h.status}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{h.location || 'Location not set'}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => setViewHotel(h)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleStatus(h.id)}><Ban className="h-4 w-4 mr-2" />{h.status === 'active' ? 'Suspend' : 'Activate'}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold">{h.rooms}</p><p className="text-xs text-muted-foreground">Rooms</p></div>
                                    <div className="p-2 rounded-lg bg-emerald-500/10"><p className="font-bold text-emerald-600">{totalAvailable(h)}</p><p className="text-xs text-muted-foreground">Available</p></div>
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold">{h.occupancy}%</p><p className="text-xs text-muted-foreground">Occupancy</p></div>
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold flex items-center justify-center gap-0.5"><Star className="h-3.5 w-3.5 text-amber-500" />{h.rating}</p><p className="text-xs text-muted-foreground">Rating</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Hotel Detail Modal */}
            {viewHotel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewHotel(null)}>
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold">{viewHotel.name}</h2>
                                        <Badge variant={viewHotel.status === 'active' ? 'success' : 'destructive'}>{viewHotel.status}</Badge>
                                    </div>
                                    <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{viewHotel.location || 'Location not set'}</p>
                                    <p className="text-sm text-muted-foreground">{viewHotel.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setViewHotel(null)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><BedDouble className="h-5 w-5 mx-auto mb-1 text-blue-500" /><p className="text-lg font-bold">{viewHotel.rooms}</p><p className="text-xs text-muted-foreground">Total Rooms</p></div>
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-center"><CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-500" /><p className="text-lg font-bold text-emerald-600">{totalAvailable(viewHotel)}</p><p className="text-xs text-muted-foreground">Available</p></div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><Users className="h-5 w-5 mx-auto mb-1 text-violet-500" /><p className="text-lg font-bold">{viewHotel.occupancy}%</p><p className="text-xs text-muted-foreground">Occupancy</p></div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" /><p className="text-lg font-bold">RM {viewHotel.revenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Revenue</p></div>
                            </div>
                            <h3 className="font-semibold mb-3">Room Breakdown</h3>
                            <div className="space-y-2 mb-6">
                                {viewHotel.roomBreakdown.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No rooms configured</p>
                                ) : viewHotel.roomBreakdown.map((r) => (
                                    <div key={r.type} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="font-medium capitalize">{r.type}</p>
                                            <p className="text-xs text-muted-foreground">RM {r.price.toLocaleString()}/night</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.total > 0 ? (r.available / r.total) * 100 : 0}%` }} />
                                            </div>
                                            <span className="text-sm"><span className="text-emerald-600 font-bold">{r.available}</span><span className="text-muted-foreground">/{r.total}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button variant={viewHotel.status === 'active' ? 'destructive' : 'default'} onClick={() => { toggleStatus(viewHotel.id); setViewHotel(prev => prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null) }}>
                                    {viewHotel.status === 'active' ? <><Ban className="h-4 w-4 mr-1" />Suspend</> : <><CheckCircle2 className="h-4 w-4 mr-1" />Activate</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
