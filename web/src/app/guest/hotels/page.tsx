"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Star, Filter, SlidersHorizontal } from 'lucide-react'

const allHotels = [
    { id: '1', name: 'Grand Azure Resort', location: 'Miami Beach, FL', rating: 4.8, reviews: 324, priceFrom: 179, image: '🏖️', tags: ['Beachfront', 'Spa', 'Pool'], description: 'Luxury beachfront resort with world-class spa and infinity pool.' },
    { id: '2', name: 'Mountain Retreat Lodge', location: 'Aspen, CO', rating: 4.9, reviews: 189, priceFrom: 299, image: '🏔️', tags: ['Mountain View', 'Ski Access', 'Fireplace'], description: 'Cozy mountain lodge with ski-in/ski-out access and fireplace suites.' },
    { id: '3', name: 'City Center Boutique', location: 'New York, NY', rating: 4.6, reviews: 512, priceFrom: 249, image: '🌃', tags: ['Downtown', 'Restaurant', 'Rooftop'], description: 'Chic boutique hotel in the heart of Manhattan with rooftop bar.' },
    { id: '4', name: 'Tropical Paradise Inn', location: 'Maui, HI', rating: 4.7, reviews: 267, priceFrom: 349, image: '🌴', tags: ['Ocean View', 'Snorkeling', 'Sunset'], description: 'Tropical escape with private beach access and underwater adventures.' },
    { id: '5', name: 'Historic Downtown Hotel', location: 'Charleston, SC', rating: 4.5, reviews: 143, priceFrom: 159, image: '🏛️', tags: ['Historic', 'Fine Dining', 'Garden'], description: 'Restored 1800s mansion with southern charm and award-winning cuisine.' },
    { id: '6', name: 'Desert Oasis Resort', location: 'Scottsdale, AZ', rating: 4.6, reviews: 198, priceFrom: 219, image: '🏜️', tags: ['Desert', 'Golf', 'Wellness'], description: 'Luxury desert resort with championship golf course and wellness center.' },
]

export default function GuestHotelsPage() {
    const [search, setSearch] = useState('')
    const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'mid' | 'high'>('all')
    const [showFilters, setShowFilters] = useState(false)

    const filtered = allHotels.filter(h => {
        const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
            h.location.toLowerCase().includes(search.toLowerCase()) ||
            h.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
        const matchPrice = priceFilter === 'all' ||
            (priceFilter === 'low' && h.priceFrom < 200) ||
            (priceFilter === 'mid' && h.priceFrom >= 200 && h.priceFrom < 300) ||
            (priceFilter === 'high' && h.priceFrom >= 300)
        return matchSearch && matchPrice
    })

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Explore Hotels</h1>
                <p className="text-muted-foreground">Find your perfect stay</p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search hotels, cities, amenities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </div>

            {showFilters && (
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'low', 'mid', 'high'] as const).map(f => (
                        <Button
                            key={f}
                            variant={priceFilter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPriceFilter(f)}
                        >
                            {f === 'all' ? 'All Prices' : f === 'low' ? 'Under $200' : f === 'mid' ? '$200-$300' : '$300+'}
                        </Button>
                    ))}
                </div>
            )}

            <p className="text-sm text-muted-foreground">{filtered.length} hotel{filtered.length !== 1 ? 's' : ''} found</p>

            {/* Hotel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((hotel) => (
                    <Link key={hotel.id} href={`/guest/hotels/${hotel.id}`}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
                            <CardContent className="p-5">
                                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform text-center">
                                    {hotel.image}
                                </div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                    {hotel.name}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" /> {hotel.location}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{hotel.description}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <Badge variant="outline" className="text-amber-600">
                                        <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                        {hotel.rating}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">({hotel.reviews} reviews)</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {hotel.tags.map(t => (
                                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                                    <p className="text-xl font-bold text-primary">
                                        ${hotel.priceFrom}<span className="text-xs font-normal text-muted-foreground">/night</span>
                                    </p>
                                    <Button size="sm">View Rooms</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
