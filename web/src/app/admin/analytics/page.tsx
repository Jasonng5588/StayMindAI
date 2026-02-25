"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Hotel, DollarSign, CalendarCheck, Loader2 } from 'lucide-react'

interface AnalyticsData {
    totalRevenue: number; totalBookings: number; totalUsers: number; totalHotels: number
    monthlyRevenue: number[]; monthlyBookings: number[]
    topHotels: { name: string; revenue: number; bookings: number; avgRating: string }[]
    months: string[]
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/data?type=analytics')
                if (res.ok) setData(await res.json())
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchAnalytics()
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading analytics...</span></div>
    }

    const months = data?.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const revenueData = data?.monthlyRevenue || []
    const bookingData = data?.monthlyBookings || []
    const maxRevenue = Math.max(...revenueData, 1)
    const maxBookings = Math.max(...bookingData, 1)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Platform-wide performance metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `RM ${((data?.totalRevenue || 0) / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Total Bookings', value: (data?.totalBookings || 0).toLocaleString(), icon: CalendarCheck, color: 'text-blue-600 bg-blue-500/10' },
                    { label: 'Total Users', value: (data?.totalUsers || 0).toLocaleString(), icon: Users, color: 'text-violet-600 bg-violet-500/10' },
                    { label: 'Active Hotels', value: (data?.totalHotels || 0).toString(), icon: Hotel, color: 'text-amber-600 bg-amber-500/10' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader><CardTitle>Revenue Trend</CardTitle><CardDescription>Monthly platform revenue</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48">
                        {revenueData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">RM{val > 0 ? `${(val / 1000).toFixed(0)}K` : '0'}</span>
                                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:opacity-80" style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: val > 0 ? '4px' : '2px' }} />
                                <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Bookings Chart */}
            <Card>
                <CardHeader><CardTitle>Bookings</CardTitle><CardDescription>Monthly booking volume</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-40">
                        {bookingData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">{val}</span>
                                <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${(val / maxBookings) * 100}%`, minHeight: val > 0 ? '4px' : '2px' }} />
                                <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Hotels */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Top Performing Hotels</CardTitle></CardHeader>
                <CardContent>
                    {(data?.topHotels || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hotel data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {(data?.topHotels || []).map((h, i) => (
                                <div key={h.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                                    <span className="text-2xl font-bold text-muted-foreground w-8">#{i + 1}</span>
                                    <div className="flex-1"><p className="font-semibold">{h.name}</p></div>
                                    <div className="text-right text-sm"><p className="font-semibold">RM {h.revenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">{h.bookings} bookings • ⭐ {h.avgRating}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
