"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    LayoutDashboard, Users, BedDouble, DollarSign, CalendarCheck,
    TrendingUp, MessageCircle, Image, Star, Loader2, ArrowRight,
    Clock, AlertCircle, CheckCircle2
} from 'lucide-react'

interface DashboardStats {
    totalGuests: number; totalRooms: number; availableRooms: number
    totalBookings: number; totalRevenue: number; openTickets: number
    activeBanners: number; avgRating: number
}

interface RecentBooking { id: string; guest: string; room: string; check_in_date: string; status: string }
interface OpenTicket { id: string; subject: string; from: string; priority: string; created_at: string }

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [bookings, setBookings] = useState<RecentBooking[]>([])
    const [tickets, setTickets] = useState<OpenTicket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchDashboard() }, [])

    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=dashboard')
            if (!res.ok) { setLoading(false); return }
            const data = await res.json()

            setStats(data.stats)

            if (data.recentBookings) {
                setBookings(data.recentBookings.map((b: Record<string, unknown>) => ({
                    id: b.id as string,
                    guest: (b.profiles as { full_name: string })?.full_name || 'Guest',
                    room: (b.room_types as { name: string })?.name || 'Room',
                    check_in_date: (b.check_in_date as string) || '',
                    status: b.status as string,
                })))
            }

            if (data.openTickets) {
                setTickets(data.openTickets.map((t: Record<string, unknown>) => ({
                    id: t.id as string,
                    subject: t.subject as string,
                    from: (t.profiles as { full_name: string })?.full_name || 'Guest',
                    priority: t.priority as string,
                    created_at: t.created_at as string,
                })))
            }
        } catch (err) { console.error('Dashboard error:', err) }
        setLoading(false)
    }

    const statusColors: Record<string, string> = { confirmed: 'success', pending: 'warning', cancelled: 'destructive', checked_in: 'default', checked_out: 'secondary' }
    const priorityColors: Record<string, string> = { low: 'secondary', medium: 'warning', high: 'destructive', critical: 'destructive' }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading dashboard...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><LayoutDashboard className="h-5 w-5 text-primary" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1><p className="text-muted-foreground">Hotel management overview</p></div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                        <div><p className="text-2xl font-bold">RM {(stats?.totalRevenue || 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Revenue</p></div>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-600" /></div>
                        <div><p className="text-2xl font-bold">{stats?.totalGuests}</p><p className="text-sm text-muted-foreground">Total Guests</p></div>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10"><BedDouble className="h-5 w-5 text-violet-600" /></div>
                        <div><p className="text-2xl font-bold">{stats?.availableRooms}/{stats?.totalRooms}</p><p className="text-sm text-muted-foreground">Rooms Available</p></div>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10"><CalendarCheck className="h-5 w-5 text-amber-600" /></div>
                        <div><p className="text-2xl font-bold">{stats?.totalBookings}</p><p className="text-sm text-muted-foreground">Total Bookings</p></div>
                    </div>
                </CardContent></Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1"><AlertCircle className="h-4 w-4 text-red-500" /></div>
                    <p className="text-xl font-bold text-red-500">{stats?.openTickets}</p>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1"><Image className="h-4 w-4 text-pink-500" /></div>
                    <p className="text-xl font-bold">{stats?.activeBanners}</p>
                    <p className="text-sm text-muted-foreground">Active Banners</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1"><Star className="h-4 w-4 text-amber-500" /></div>
                    <p className="text-xl font-bold">{stats?.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                </CardContent></Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Recent Bookings</h2>
                            <Button variant="ghost" size="sm" asChild><Link href="/admin/bookings">View All <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                        </div>
                        {bookings.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                                        <div>
                                            <p className="font-medium">{b.guest}</p>
                                            <p className="text-xs text-muted-foreground">{b.room} • {b.check_in_date}</p>
                                        </div>
                                        <Badge variant={statusColors[b.status] as 'success' | 'warning' | 'destructive' | 'secondary' | 'default'}>{b.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Open Tickets */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Open Support Tickets</h2>
                            <Button variant="ghost" size="sm" asChild><Link href="/admin/support">View All <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                        </div>
                        {tickets.length === 0 ? (
                            <div className="text-center py-4">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">All tickets resolved!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                                        <div>
                                            <p className="font-medium">{t.subject}</p>
                                            <p className="text-xs text-muted-foreground">{t.from} • {new Date(t.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Badge variant={priorityColors[t.priority] as 'warning' | 'destructive' | 'secondary'}>{t.priority}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Customers', href: '/admin/customers', icon: Users, color: 'bg-violet-500/10 text-violet-600' },
                    { label: 'Payments', href: '/admin/payments', icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-600' },
                    { label: 'Banners', href: '/admin/banners', icon: Image, color: 'bg-pink-500/10 text-pink-600' },
                    { label: 'Support', href: '/admin/support', icon: MessageCircle, color: 'bg-red-500/10 text-red-600' },
                    { label: 'Users', href: '/admin/users', icon: Users, color: 'bg-indigo-500/10 text-indigo-600' },
                    { label: 'Loyalty', href: '/admin/loyalty', icon: Star, color: 'bg-amber-500/10 text-amber-600' },
                ].map(a => (
                    <Link key={a.href} href={a.href}>
                        <Card className="hover:shadow-md transition-all cursor-pointer group">
                            <CardContent className="p-4 text-center">
                                <div className={`p-2 rounded-lg ${a.color} w-fit mx-auto mb-2 group-hover:scale-110 transition-transform`}><a.icon className="h-5 w-5" /></div>
                                <p className="text-sm font-medium">{a.label}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
