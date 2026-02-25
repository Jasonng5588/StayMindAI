"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit2, Trash2, Save, X, BedDouble, DollarSign, Users } from 'lucide-react'

interface RoomType { id: string; name: string; basePrice: number; maxOccupancy: number; bedType: string; roomCount: number; activeRooms: number }
interface Room { id: string; number: string; type: string; floor: number; status: string; price: number }

const initialRoomTypes: RoomType[] = [
    { id: '1', name: 'Ocean View Deluxe', basePrice: 299, maxOccupancy: 2, bedType: 'King', roomCount: 3, activeRooms: 3 },
    { id: '2', name: 'Garden Suite', basePrice: 449, maxOccupancy: 4, bedType: 'King', roomCount: 2, activeRooms: 2 },
    { id: '3', name: 'Standard Room', basePrice: 179, maxOccupancy: 2, bedType: 'Queen', roomCount: 4, activeRooms: 3 },
]

const initialRooms: Room[] = [
    { id: '1', number: '101', type: 'Ocean View Deluxe', floor: 1, status: 'available', price: 299 },
    { id: '2', number: '102', type: 'Ocean View Deluxe', floor: 1, status: 'available', price: 299 },
    { id: '3', number: '103', type: 'Ocean View Deluxe', floor: 1, status: 'occupied', price: 299 },
    { id: '4', number: '201', type: 'Garden Suite', floor: 2, status: 'occupied', price: 449 },
    { id: '5', number: '202', type: 'Garden Suite', floor: 2, status: 'maintenance', price: 449 },
    { id: '6', number: '301', type: 'Standard Room', floor: 3, status: 'available', price: 179 },
    { id: '7', number: '302', type: 'Standard Room', floor: 3, status: 'cleaning', price: 179 },
    { id: '8', number: '303', type: 'Standard Room', floor: 3, status: 'available', price: 179 },
    { id: '9', number: '304', type: 'Standard Room', floor: 3, status: 'out_of_order', price: 179 },
]

const statusColors: Record<string, string> = {
    available: 'bg-emerald-500', occupied: 'bg-blue-500', maintenance: 'bg-orange-500', cleaning: 'bg-amber-500', out_of_order: 'bg-red-500',
}

export default function RoomsPage() {
    const [roomTypes, setRoomTypes] = useState(initialRoomTypes)
    const [rooms, setRooms] = useState(initialRooms)
    const [search, setSearch] = useState('')
    const [showTypeForm, setShowTypeForm] = useState(false)
    const [showRoomForm, setShowRoomForm] = useState(false)
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
    const [typeForm, setTypeForm] = useState({ name: '', basePrice: 0, maxOccupancy: 2, bedType: 'King' })
    const [roomForm, setRoomForm] = useState({ number: '', type: '', floor: 1, price: 0 })

    const filtered = rooms.filter(r =>
        r.number.includes(search) || r.type.toLowerCase().includes(search.toLowerCase()) || r.status.includes(search.toLowerCase())
    )

    // Room Type CRUD
    const handleSaveType = () => {
        if (!typeForm.name || typeForm.basePrice <= 0) { alert('Fill name and price'); return }
        if (editingTypeId) {
            setRoomTypes(prev => prev.map(rt => rt.id === editingTypeId ? { ...rt, ...typeForm } : rt))
        } else {
            setRoomTypes(prev => [...prev, { id: `rt-${Date.now()}`, ...typeForm, roomCount: 0, activeRooms: 0 }])
        }
        setShowTypeForm(false); setEditingTypeId(null)
    }

    const editRoomType = (rt: RoomType) => {
        setTypeForm({ name: rt.name, basePrice: rt.basePrice, maxOccupancy: rt.maxOccupancy, bedType: rt.bedType })
        setEditingTypeId(rt.id); setShowTypeForm(true); setShowRoomForm(false)
    }

    const deleteRoomType = (id: string) => { if (confirm('Delete this room type?')) setRoomTypes(prev => prev.filter(rt => rt.id !== id)) }

    // Room CRUD
    const handleSaveRoom = () => {
        if (!roomForm.number || !roomForm.type) { alert('Fill room number and type'); return }
        if (editingRoomId) {
            setRooms(prev => prev.map(r => r.id === editingRoomId ? { ...r, ...roomForm } : r))
        } else {
            setRooms(prev => [...prev, { id: `r-${Date.now()}`, ...roomForm, status: 'available' }])
        }
        setShowRoomForm(false); setEditingRoomId(null)
    }

    const editRoom = (r: Room) => {
        setRoomForm({ number: r.number, type: r.type, floor: r.floor, price: r.price })
        setEditingRoomId(r.id); setShowRoomForm(true); setShowTypeForm(false)
    }

    const deleteRoom = (id: string) => { if (confirm('Delete this room?')) setRooms(prev => prev.filter(r => r.id !== id)) }

    const changeStatus = (id: string, status: string) => {
        setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
                    <p className="text-muted-foreground">Manage room types and individual rooms</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowTypeForm(true); setShowRoomForm(false); setEditingTypeId(null); setTypeForm({ name: '', basePrice: 0, maxOccupancy: 2, bedType: 'King' }) }}>
                        <Plus className="h-4 w-4 mr-2" /> Room Type
                    </Button>
                    <Button onClick={() => { setShowRoomForm(true); setShowTypeForm(false); setEditingRoomId(null); setRoomForm({ number: '', type: roomTypes[0]?.name || '', floor: 1, price: roomTypes[0]?.basePrice || 0 }) }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Room
                    </Button>
                </div>
            </div>

            {/* Room Type Form */}
            {showTypeForm && (
                <Card className="border-primary/20">
                    <CardHeader><CardTitle>{editingTypeId ? 'Edit' : 'New'} Room Type</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium block mb-1.5">Name *</label><Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="e.g. Deluxe Suite" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Base Price ($) *</label><Input type="number" value={typeForm.basePrice} onChange={(e) => setTypeForm({ ...typeForm, basePrice: Number(e.target.value) })} /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Max Occupancy</label><Input type="number" value={typeForm.maxOccupancy} onChange={(e) => setTypeForm({ ...typeForm, maxOccupancy: Number(e.target.value) })} /></div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Bed Type</label>
                                <div className="flex gap-2">
                                    {['King', 'Queen', 'Twin', 'Double'].map(b => (
                                        <Button key={b} variant={typeForm.bedType === b ? 'default' : 'outline'} size="sm" onClick={() => setTypeForm({ ...typeForm, bedType: b })}>{b}</Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveType}><Save className="h-4 w-4 mr-2" /> {editingTypeId ? 'Update' : 'Create'}</Button>
                            <Button variant="outline" onClick={() => { setShowTypeForm(false); setEditingTypeId(null) }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Room Form */}
            {showRoomForm && (
                <Card className="border-primary/20">
                    <CardHeader><CardTitle>{editingRoomId ? 'Edit' : 'Add'} Room</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium block mb-1.5">Room Number *</label><Input value={roomForm.number} onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })} placeholder="e.g. 101" /></div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Room Type *</label>
                                <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={roomForm.type} onChange={(e) => { const rt = roomTypes.find(r => r.name === e.target.value); setRoomForm({ ...roomForm, type: e.target.value, price: rt?.basePrice || roomForm.price }) }}>
                                    {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name} (${rt.basePrice}/night)</option>)}
                                </select>
                            </div>
                            <div><label className="text-sm font-medium block mb-1.5">Floor</label><Input type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })} /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Price Override ($)</label><Input type="number" value={roomForm.price} onChange={(e) => setRoomForm({ ...roomForm, price: Number(e.target.value) })} /></div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveRoom}><Save className="h-4 w-4 mr-2" /> {editingRoomId ? 'Update' : 'Add'}</Button>
                            <Button variant="outline" onClick={() => { setShowRoomForm(false); setEditingRoomId(null) }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Room Types */}
            <Card>
                <CardHeader><CardTitle>Room Types</CardTitle><CardDescription>Define your room categories</CardDescription></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roomTypes.map(rt => (
                            <div key={rt.id} className="p-4 rounded-lg border hover:border-primary/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{rt.name}</h3>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editRoomType(rt)}><Edit2 className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRoomType(rt.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="flex items-center gap-1 text-muted-foreground"><DollarSign className="h-3 w-3" />${rt.basePrice}/night</span>
                                    <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" />Max {rt.maxOccupancy}</span>
                                    <span className="flex items-center gap-1 text-muted-foreground"><BedDouble className="h-3 w-3" />{rt.bedType}</span>
                                    <span className="text-muted-foreground">{rt.roomCount} rooms</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(room => (
                    <Card key={room.id} className="hover:shadow-lg transition-all group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold">#{room.number}</span>
                                <div className={`h-3 w-3 rounded-full ${statusColors[room.status]}`} title={room.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">{room.type}</p>
                            <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                            <p className="text-sm font-semibold mt-1">${room.price}/night</p>
                            <Badge variant={room.status === 'available' ? 'success' : room.status === 'occupied' ? 'default' : 'warning'} className="mt-2 w-full justify-center">
                                {room.status.replace('_', ' ')}
                            </Badge>
                            {/* Status change buttons */}
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {room.status !== 'available' && <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => changeStatus(room.id, 'available')}>Avail</Button>}
                                {room.status !== 'maintenance' && <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => changeStatus(room.id, 'maintenance')}>Maint</Button>}
                            </div>
                            <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="flex-1 text-xs h-7" onClick={() => editRoom(room)}><Edit2 className="h-3 w-3 mr-1" />Edit</Button>
                                <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 text-destructive" onClick={() => deleteRoom(room.id)}><Trash2 className="h-3 w-3 mr-1" />Del</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
