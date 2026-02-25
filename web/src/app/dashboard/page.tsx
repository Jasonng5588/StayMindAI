"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DollarSign,
    CalendarCheck,
    BedDouble,
    TrendingUp,
    TrendingDown,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Plus,
    Star,
    Clock,
} from 'lucide-react'

// Mock data for demo (will be replaced with real Supabase data)
const kpiData = [
    {
        title: 'Total Revenue',
        value: '$48,352',
        change: '+12.5%',
        trending: 'up',
        icon: DollarSign,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
    },
    {
        title: 'Total Bookings',
        value: '284',
        change: '+8.2%',
        trending: 'up',
        icon: CalendarCheck,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
    },
    {
        title: 'Occupancy Rate',
        value: '78.5%',
        change: '-2.1%',
        trending: 'down',
        icon: BedDouble,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-500/10',
    },
    {
        title: 'Avg. Daily Rate',
        value: '$245',
        change: '+5.8%',
        trending: 'up',
        icon: TrendingUp,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10',
    },
]

const recentBookings = [
    { id: 'BK-20260224-a1b2c3d4', guest: 'Sarah Johnson', room: 'Ocean View Deluxe', checkIn: 'Feb 24', checkOut: 'Feb 27', status: 'confirmed', amount: '$897' },
    { id: 'BK-20260224-e5f6g7h8', guest: 'Michael Chen', room: 'Garden Suite', checkIn: 'Feb 24', checkOut: 'Feb 26', status: 'checked_in', amount: '$898' },
    { id: 'BK-20260223-i9j0k1l2', guest: 'Emma Williams', room: 'Standard Room', checkIn: 'Feb 23', checkOut: 'Feb 25', status: 'checked_in', amount: '$358' },
    { id: 'BK-20260225-m3n4o5p6', guest: 'James Brown', room: 'Ocean View Deluxe', checkIn: 'Feb 25', checkOut: 'Feb 28', status: 'pending', amount: '$897' },
    { id: 'BK-20260222-q7r8s9t0', guest: 'Lisa Davis', room: 'Garden Suite', checkIn: 'Feb 22', checkOut: 'Feb 24', status: 'checked_out', amount: '$898' },
]

const todayActivity = [
    { icon: '🟢', text: 'Check-in: Sarah Johnson – Room 101', time: '2:00 PM' },
    { icon: '🔵', text: 'Check-out: Lisa Davis – Room 201', time: '11:00 AM' },
    { icon: '🟡', text: 'Housekeeping: Room 302 – Cleaning', time: '10:30 AM' },
    { icon: '🟠', text: 'Maintenance: Room 302 – AC repair', time: '09:00 AM' },
    { icon: '⭐', text: 'New review from Emma Williams (4 stars)', time: '08:15 AM' },
]

const roomStats = [
    { label: 'Available', count: 12, color: 'bg-emerald-500' },
    { label: 'Occupied', count: 8, color: 'bg-blue-500' },
    { label: 'Cleaning', count: 2, color: 'bg-amber-500' },
    { label: 'Maintenance', count: 1, color: 'bg-red-500' },
]

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here&apos;s your hotel overview.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/reports">
                            <Clock className="h-4 w-4 mr-2" />
                            Last 30 days
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/dashboard/bookings">
                            <Plus className="h-4 w-4 mr-2" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi) => (
                    <Card key={kpi.title} className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trending === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {kpi.trending === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    {kpi.change}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold">{kpi.value}</p>
                                <p className="text-sm text-muted-foreground mt-1">{kpi.title}</p>
                            </div>
                            {/* Decorative gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart Placeholder */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Monthly revenue for the current period</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Revenue bar chart visualization */}
                        <div className="flex items-end gap-2 h-48">
                            {[65, 45, 78, 52, 90, 68, 84, 72, 95, 60, 88, 76].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 hover:from-primary hover:to-primary/80"
                                        style={{ height: `${height}%` }}
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Room Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Room Status</CardTitle>
                        <CardDescription>Current room availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Donut-like visual */}
                            <div className="flex items-center justify-center">
                                <div className="relative w-32 h-32">
                                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                        {(() => {
                                            const total = roomStats.reduce((a, b) => a + b.count, 0)
                                            let accumulated = 0
                                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                                            return roomStats.map((stat, i) => {
                                                const percentage = (stat.count / total) * 100
                                                const dashArray = `${percentage * 2.51} ${251 - percentage * 2.51}`
                                                const dashOffset = -accumulated * 2.51
                                                accumulated += percentage
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx="50" cy="50" r="40"
                                                        fill="none"
                                                        stroke={colors[i]}
                                                        strokeWidth="12"
                                                        strokeDasharray={dashArray}
                                                        strokeDashoffset={dashOffset}
                                                        className="transition-all duration-700"
                                                    />
                                                )
                                            })
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-2xl font-bold">{roomStats.reduce((a, b) => a + b.count, 0)}</span>
                                        <span className="text-xs text-muted-foreground">Total</span>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-3">
                                {roomStats.map((stat) => (
                                    <div key={stat.label} className="flex items-center gap-2">
                                        <div className={`h-3 w-3 rounded-full ${stat.color}`} />
                                        <div>
                                            <p className="text-sm font-medium">{stat.count}</p>
                                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Bookings & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Bookings */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Bookings</CardTitle>
                            <CardDescription>Latest booking activity</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild><Link href="/dashboard/bookings">View All</Link></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                        {booking.guest.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{booking.guest}</p>
                                        <p className="text-xs text-muted-foreground">{booking.room} • {booking.checkIn} → {booking.checkOut}</p>
                                    </div>
                                    <Badge variant={
                                        booking.status === 'confirmed' ? 'default' :
                                            booking.status === 'checked_in' ? 'success' :
                                                booking.status === 'checked_out' ? 'secondary' :
                                                    booking.status === 'pending' ? 'warning' : 'outline'
                                    }>
                                        {booking.status.replace('_', ' ')}
                                    </Badge>
                                    <p className="text-sm font-semibold w-16 text-right">{booking.amount}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Today Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Today&apos;s Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {todayActivity.map((activity, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">{activity.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm">{activity.text}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Star className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Average Rating</p>
                                <p className="text-2xl font-bold">4.7</p>
                                <p className="text-xs text-muted-foreground">Based on 156 reviews</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Guests Today</p>
                                <p className="text-2xl font-bold">24</p>
                                <p className="text-xs text-muted-foreground">5 check-ins, 3 check-outs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10">
                                <DollarSign className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                                <p className="text-2xl font-bold">$3,420</p>
                                <p className="text-xs text-muted-foreground">+$580 from yesterday</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
