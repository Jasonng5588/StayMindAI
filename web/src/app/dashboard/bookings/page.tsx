"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Plus, CalendarCheck, MoreHorizontal, Eye, CheckCircle2, XCircle, Save, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Booking {
    id: string; guest: string; email: string; room: string; checkIn: string; checkOut: string; status: string; amount: number; nights: number
}

const initialBookings: Booking[] = [
    { id: 'BK-001', guest: 'Sarah Johnson', email: 'sarah@email.com', room: 'Ocean View Deluxe', checkIn: '2026-02-24', checkOut: '2026-02-27', status: 'confirmed', amount: 897, nights: 3 },
    { id: 'BK-002', guest: 'Michael Chen', email: 'michael@email.com', room: 'Garden Suite', checkIn: '2026-02-24', checkOut: '2026-02-26', status: 'checked_in', amount: 898, nights: 2 },
    { id: 'BK-003', guest: 'Emma Williams', email: 'emma@email.com', room: 'Standard Room', checkIn: '2026-02-23', checkOut: '2026-02-25', status: 'checked_in', amount: 358, nights: 2 },
    { id: 'BK-004', guest: 'James Brown', email: 'james@email.com', room: 'Ocean View Deluxe', checkIn: '2026-02-25', checkOut: '2026-02-28', status: 'pending', amount: 897, nights: 3 },
    { id: 'BK-005', guest: 'Lisa Davis', email: 'lisa@email.com', room: 'Garden Suite', checkIn: '2026-02-22', checkOut: '2026-02-24', status: 'checked_out', amount: 898, nights: 2 },
    { id: 'BK-006', guest: 'Robert Kim', email: 'robert@email.com', room: 'Standard Room', checkIn: '2026-02-26', checkOut: '2026-02-28', status: 'confirmed', amount: 358, nights: 2 },
    { id: 'BK-007', guest: 'Maria Lopez', email: 'maria@email.com', room: 'Ocean View Deluxe', checkIn: '2026-02-20', checkOut: '2026-02-22', status: 'cancelled', amount: 598, nights: 2 },
]

const statusMap: Record<string, { color: string; variant: string }> = {
    confirmed: { color: 'text-blue-600', variant: 'default' },
    checked_in: { color: 'text-emerald-600', variant: 'success' },
    checked_out: { color: 'text-slate-600', variant: 'secondary' },
    pending: { color: 'text-amber-600', variant: 'warning' },
    cancelled: { color: 'text-red-600', variant: 'destructive' },
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState(initialBookings)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ guest: '', email: '', room: 'Ocean View Deluxe', checkIn: '', checkOut: '', amount: 0 })

    const filtered = bookings.filter(b => {
        const matchSearch = b.guest.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || b.status === statusFilter
        return matchSearch && matchStatus
    })

    const handleNewBooking = () => {
        if (!form.guest || !form.checkIn || !form.checkOut) { alert('Fill in guest name and dates'); return }
        const ci = new Date(form.checkIn); const co = new Date(form.checkOut)
        const nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000))
        setBookings(prev => [{
            id: `BK-${(prev.length + 1).toString().padStart(3, '0')}`,
            guest: form.guest, email: form.email, room: form.room,
            checkIn: form.checkIn, checkOut: form.checkOut,
            status: 'confirmed', amount: form.amount || nights * 299, nights,
        }, ...prev])
        setShowForm(false)
        setForm({ guest: '', email: '', room: 'Ocean View Deluxe', checkIn: '', checkOut: '', amount: 0 })
    }

    const changeStatus = (id: string, status: string) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))

    const exportCSV = () => {
        const header = 'ID,Guest,Room,Check-In,Check-Out,Status,Amount'
        const rows = bookings.map(b => `${b.id},${b.guest},${b.room},${b.checkIn},${b.checkOut},${b.status},$${b.amount}`)
        const csv = [header, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground">Manage reservations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                    <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> New Booking</Button>
                </div>
            </div>

            {/* New booking form */}
            {showForm && (
                <Card className="border-primary/20">
                    <CardHeader><CardTitle>New Booking</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium block mb-1.5">Guest Name *</label><Input value={form.guest} onChange={(e) => setForm({ ...form, guest: e.target.value })} placeholder="Full name" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@email.com" /></div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Room</label>
                                <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}>
                                    <option>Ocean View Deluxe</option>
                                    <option>Garden Suite</option>
                                    <option>Standard Room</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium block mb-1.5">Amount ($)</label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Check-In *</label><Input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Check-Out *</label><Input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleNewBooking}><Save className="h-4 w-4 mr-2" /> Create Booking</Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['confirmed', 'checked_in', 'pending', 'checked_out', 'cancelled'].map(s => (
                    <Card key={s} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}>
                        <CardContent className="p-4 text-center">
                            <p className={`text-2xl font-bold ${statusMap[s]?.color}`}>{bookings.filter(b => b.status === s).length}</p>
                            <p className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                {statusFilter !== 'all' && (
                    <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>Clear filter</Button>
                )}
            </div>

            {/* Bookings Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium">ID</th>
                                    <th className="text-left p-3 font-medium">Guest</th>
                                    <th className="text-left p-3 font-medium">Room</th>
                                    <th className="text-left p-3 font-medium">Dates</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-right p-3 font-medium">Amount</th>
                                    <th className="text-right p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono text-xs">{b.id}</td>
                                        <td className="p-3"><p className="font-medium">{b.guest}</p><p className="text-xs text-muted-foreground">{b.email}</p></td>
                                        <td className="p-3">{b.room}</td>
                                        <td className="p-3"><p>{b.checkIn}</p><p className="text-xs text-muted-foreground">→ {b.checkOut} ({b.nights}n)</p></td>
                                        <td className="p-3"><Badge variant={statusMap[b.status]?.variant as 'default'}>{b.status.replace('_', ' ')}</Badge></td>
                                        <td className="p-3 text-right font-semibold">${b.amount}</td>
                                        <td className="p-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {b.status === 'confirmed' && <DropdownMenuItem onClick={() => changeStatus(b.id, 'checked_in')}><CheckCircle2 className="h-4 w-4 mr-2" /> Check In</DropdownMenuItem>}
                                                    {b.status === 'checked_in' && <DropdownMenuItem onClick={() => changeStatus(b.id, 'checked_out')}><CheckCircle2 className="h-4 w-4 mr-2" /> Check Out</DropdownMenuItem>}
                                                    {b.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => changeStatus(b.id, 'confirmed')}><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => changeStatus(b.id, 'cancelled')}><XCircle className="h-4 w-4 mr-2" /> Cancel</DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {(b.status === 'confirmed' || b.status === 'pending') && (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => changeStatus(b.id, 'cancelled')}><XCircle className="h-4 w-4 mr-2" /> Cancel</DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
