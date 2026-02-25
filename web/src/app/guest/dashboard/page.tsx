"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    BedDouble, CalendarCheck, Star, MapPin, Wifi, Car, UtensilsCrossed,
    Waves, Dumbbell, Sparkles, MessageCircle, Clock, Phone,
    LifeBuoy, Crown, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface BannerData {
    id: string; title: string; subtitle: string; link_url: string; image_url?: string
}

const amenities = [
    { icon: Waves, label: 'Private Beach' },
    { icon: Dumbbell, label: 'Fitness Center' },
    { icon: Wifi, label: 'Free Wi-Fi' },
    { icon: Car, label: 'Valet Parking' },
    { icon: UtensilsCrossed, label: 'Fine Dining' },
    { icon: Sparkles, label: 'Full-Service Spa' },
]

const gradients = [
    'from-cyan-500/20 to-blue-500/10',
    'from-violet-500/20 to-purple-500/10',
    'from-amber-500/20 to-orange-500/10',
    'from-emerald-500/20 to-green-500/10',
    'from-pink-500/20 to-rose-500/10',
]

export default function GuestDashboardPage() {
    const [userName, setUserName] = useState('Guest')
    const [banners, setBanners] = useState<BannerData[]>([])
    const [bannerIdx, setBannerIdx] = useState(0)
    const [hotelInfo, setHotelInfo] = useState({ name: 'StayMind AI Hotel', location: '', rating: 0, reviewCount: 0, phone: '', checkIn: '3:00 PM', checkOut: '11:00 AM' })
    const [stats, setStats] = useState({ rooms: 0, avgRating: '0', bestRate: '0' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            // Get user info (auth only — not RLS-blocked)
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
                setUserName(userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'Guest')
            }

            // Get hotel info through admin data API
            const hotelRes = await fetch('/api/admin/data?type=dashboard')
            if (hotelRes.ok) {
                const dashData = await hotelRes.json()
                if (dashData.stats) {
                    setStats({
                        rooms: dashData.stats.availableRooms || 0,
                        avgRating: String(dashData.stats.avgRating || 4.5),
                        bestRate: dashData.stats.bestRate ? `RM ${dashData.stats.bestRate}` : 'N/A',
                    })
                }
            }

            // Get banners from API
            const bannerRes = await fetch('/api/banners')
            if (bannerRes.ok) {
                const bannerData = await bannerRes.json()
                if (bannerData.banners?.length > 0) {
                    setBanners(bannerData.banners.filter((b: Record<string, unknown>) => b.is_active).map((b: Record<string, string>) => ({
                        id: b.id,
                        title: b.title,
                        subtitle: b.subtitle || '',
                        link_url: b.link_url || '/guest/rooms',
                        image_url: b.image_url || '',
                    })))
                }
            }
        } catch (err) { console.error('Dashboard load error:', err) }
    }

    // Auto-rotate banners
    useEffect(() => {
        if (banners.length <= 1) return
        const timer = setInterval(() => setBannerIdx(p => (p + 1) % banners.length), 5000)
        return () => clearInterval(timer)
    }, [banners.length])

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Promotional Banner Carousel */}
            {banners.length > 0 && (
                <div className="relative">
                    <Link href={banners[bannerIdx]?.link_url || '/guest/rooms'}>
                        <div className={`rounded-2xl bg-gradient-to-r ${gradients[bannerIdx % gradients.length]} p-6 sm:p-8 border border-primary/10 transition-all duration-500 cursor-pointer hover:shadow-lg`}>
                            <p className="text-xl sm:text-2xl font-bold">{banners[bannerIdx]?.title}</p>
                            <p className="text-muted-foreground mt-1">{banners[bannerIdx]?.subtitle}</p>
                            <Button size="sm" className="mt-4">Learn More</Button>
                        </div>
                    </Link>
                    {banners.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBannerIdx(p => (p - 1 + banners.length) % banners.length)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {banners.map((_, i) => (
                                <button key={i} className={`h-2 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
                                    onClick={() => setBannerIdx(i)} />
                            ))}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBannerIdx(p => (p + 1) % banners.length)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Welcome Hero */}
            <div className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome, {userName}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Welcome to <span className="font-semibold text-foreground">{hotelInfo.name}</span>
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        {hotelInfo.location && <><MapPin className="h-4 w-4" /> {hotelInfo.location}<span className="mx-1">•</span></>}
                        {hotelInfo.rating > 0 && <><Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {hotelInfo.rating}{hotelInfo.reviewCount > 0 && ` (${hotelInfo.reviewCount} reviews)`}</>}
                    </p>
                    <div className="flex gap-3 mt-5">
                        <Button asChild size="lg"><Link href="/guest/rooms"><BedDouble className="h-4 w-4 mr-2" /> Book a Room</Link></Button>
                        <Button asChild variant="outline" size="lg"><Link href="/guest/chat"><MessageCircle className="h-4 w-4 mr-2" /> AI Concierge</Link></Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-emerald-600">{stats.rooms}</p><p className="text-sm text-muted-foreground mt-1">Available Rooms</p></CardContent></Card>
                <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-amber-600">{stats.avgRating}</p><p className="text-sm text-muted-foreground mt-1">Star Rating</p></CardContent></Card>
                <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-blue-600">{stats.bestRate}</p><p className="text-sm text-muted-foreground mt-1">Best Rate</p></CardContent></Card>
            </div>

            {/* Hotel Info & Amenities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4">Hotel Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Clock className="h-5 w-5 text-primary" />
                                <div><p className="text-sm font-medium">Check-in / Check-out</p><p className="text-sm text-muted-foreground">{hotelInfo.checkIn} / {hotelInfo.checkOut}</p></div>
                            </div>
                            {hotelInfo.phone && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <Phone className="h-5 w-5 text-primary" />
                                    <div><p className="text-sm font-medium">Front Desk</p><p className="text-sm text-muted-foreground">{hotelInfo.phone}</p></div>
                                </div>
                            )}
                            {hotelInfo.location && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <div><p className="text-sm font-medium">Location</p><p className="text-sm text-muted-foreground">{hotelInfo.location}</p></div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4">Amenities</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {amenities.map(a => (
                                <div key={a.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <a.icon className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium">{a.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Book a Room', href: '/guest/rooms', icon: BedDouble, color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'My Bookings', href: '/guest/bookings', icon: CalendarCheck, color: 'bg-emerald-500/10 text-emerald-600' },
                    { label: 'Leave a Review', href: '/guest/reviews', icon: Star, color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'AI Concierge', href: '/guest/chat', icon: MessageCircle, color: 'bg-violet-500/10 text-violet-600' },
                    { label: 'Support', href: '/guest/support', icon: LifeBuoy, color: 'bg-red-500/10 text-red-600' },
                    { label: 'Loyalty', href: '/guest/loyalty', icon: Crown, color: 'bg-pink-500/10 text-pink-600' },
                ].map(action => (
                    <Link key={action.href} href={action.href}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer group">
                            <CardContent className="p-5 text-center">
                                <div className={`p-3 rounded-xl ${action.color} w-fit mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-semibold">{action.label}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
