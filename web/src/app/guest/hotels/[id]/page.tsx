"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    MapPin, Star, Users, BedDouble, Wifi, Car, UtensilsCrossed,
    Waves, Dumbbell, ArrowLeft, CalendarCheck, Minus, Plus, CheckCircle2,
} from 'lucide-react'

const hotelsData: Record<string, {
    name: string; location: string; rating: number; reviews: number; image: string; description: string; amenities: string[]
    rooms: { id: string; name: string; price: number; maxGuests: number; bed: string; size: string; features: string[] }[]
}> = {
    '1': {
        name: 'Grand Azure Resort', location: 'Miami Beach, FL', rating: 4.8, reviews: 324, image: '🏖️',
        description: 'Experience luxury at its finest at the Grand Azure Resort, nestled along the pristine shores of Miami Beach. Our world-class amenities include an infinity pool overlooking the Atlantic Ocean, a full-service spa, and three award-winning restaurants.',
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Beach Access', 'Gym', 'Restaurant', 'Parking', 'Room Service'],
        rooms: [
            { id: 'r1', name: 'Ocean View Deluxe', price: 299, maxGuests: 2, bed: 'King', size: '45 m²', features: ['Ocean View', 'Balcony', 'Mini Bar'] },
            { id: 'r2', name: 'Garden Suite', price: 449, maxGuests: 4, bed: 'King + Sofa', size: '65 m²', features: ['Garden View', 'Living Room', 'Kitchenette'] },
            { id: 'r3', name: 'Standard Room', price: 179, maxGuests: 2, bed: 'Queen', size: '30 m²', features: ['City View', 'Work Desk'] },
        ],
    },
    '2': {
        name: 'Mountain Retreat Lodge', location: 'Aspen, CO', rating: 4.9, reviews: 189, image: '🏔️',
        description: 'Escape to the mountains at our cozy lodge with ski-in/ski-out access, roaring fireplaces, and breathtaking alpine views.',
        amenities: ['Free WiFi', 'Ski Access', 'Fireplace', 'Hot Tub', 'Restaurant', 'Spa', 'Parking'],
        rooms: [
            { id: 'r1', name: 'Alpine Suite', price: 399, maxGuests: 3, bed: 'King', size: '55 m²', features: ['Mountain View', 'Fireplace', 'Balcony'] },
            { id: 'r2', name: 'Cozy Cabin Room', price: 299, maxGuests: 2, bed: 'Queen', size: '35 m²', features: ['Forest View', 'Heated Floors'] },
        ],
    },
    '3': {
        name: 'City Center Boutique', location: 'New York, NY', rating: 4.6, reviews: 512, image: '🌃',
        description: 'A chic boutique hotel in the heart of Manhattan, steps from Times Square and Central Park.',
        amenities: ['Free WiFi', 'Rooftop Bar', 'Restaurant', 'Gym', 'Concierge', 'Room Service'],
        rooms: [
            { id: 'r1', name: 'Penthouse Suite', price: 599, maxGuests: 2, bed: 'King', size: '80 m²', features: ['City Skyline View', 'Private Terrace', 'Jacuzzi'] },
            { id: 'r2', name: 'Deluxe Room', price: 349, maxGuests: 2, bed: 'King', size: '40 m²', features: ['City View', 'Lounge Access'] },
            { id: 'r3', name: 'Standard Room', price: 249, maxGuests: 2, bed: 'Queen', size: '28 m²', features: ['Work Desk', 'Smart TV'] },
        ],
    },
    '4': {
        name: 'Tropical Paradise Inn', location: 'Maui, HI', rating: 4.7, reviews: 267, image: '🌴',
        description: 'Your tropical escape awaits with private beach access, snorkeling, and unforgettable Hawaiian sunsets.',
        amenities: ['Free WiFi', 'Beach Access', 'Snorkeling', 'Pool', 'Spa', 'Restaurant', 'Water Sports'],
        rooms: [
            { id: 'r1', name: 'Beachfront Villa', price: 499, maxGuests: 4, bed: 'King + Twin', size: '90 m²', features: ['Private Beach', 'Plunge Pool', 'Outdoor Shower'] },
            { id: 'r2', name: 'Ocean View Room', price: 349, maxGuests: 2, bed: 'King', size: '45 m²', features: ['Ocean View', 'Lanai'] },
        ],
    },
    '5': {
        name: 'Historic Downtown Hotel', location: 'Charleston, SC', rating: 4.5, reviews: 143, image: '🏛️',
        description: 'A beautifully restored 1800s mansion offering southern charm and award-winning cuisine.',
        amenities: ['Free WiFi', 'Fine Dining', 'Garden', 'Library', 'Concierge', 'Valet Parking'],
        rooms: [
            { id: 'r1', name: 'Heritage Suite', price: 279, maxGuests: 2, bed: 'King', size: '50 m²', features: ['Garden View', 'Antique Furnishings', 'Fireplace'] },
            { id: 'r2', name: 'Classic Room', price: 159, maxGuests: 2, bed: 'Queen', size: '32 m²', features: ['Period Decor', 'Work Desk'] },
        ],
    },
    '6': {
        name: 'Desert Oasis Resort', location: 'Scottsdale, AZ', rating: 4.6, reviews: 198, image: '🏜️',
        description: 'Luxury desert resort with championship golf, world-class wellness center, and stunning canyon views.',
        amenities: ['Free WiFi', 'Golf Course', 'Spa', 'Pool', 'Restaurant', 'Gym', 'Tennis Courts'],
        rooms: [
            { id: 'r1', name: 'Canyon View Suite', price: 379, maxGuests: 2, bed: 'King', size: '60 m²', features: ['Canyon View', 'Private Terrace', 'Soaking Tub'] },
            { id: 'r2', name: 'Resort Room', price: 219, maxGuests: 2, bed: 'King', size: '38 m²', features: ['Pool View', 'Balcony'] },
        ],
    },
}

const amenityIcons: Record<string, React.ElementType> = {
    'Free WiFi': Wifi, 'Parking': Car, 'Valet Parking': Car, 'Restaurant': UtensilsCrossed,
    'Fine Dining': UtensilsCrossed, 'Pool': Waves, 'Gym': Dumbbell,
}

export default function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params)
    const router = useRouter()
    const hotel = hotelsData[resolvedParams.id]
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [guests, setGuests] = useState(1)
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [bookingSuccess, setBookingSuccess] = useState(false)

    if (!hotel) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Hotel not found</h2>
                <Button className="mt-4" onClick={() => router.push('/guest/hotels')}>Back to Hotels</Button>
            </div>
        )
    }

    const handleBook = () => {
        if (!selectedRoom || !checkIn || !checkOut) {
            alert('Please select a room and enter check-in / check-out dates.')
            return
        }
        setBookingSuccess(true)
    }

    const selectedRoomData = hotel.rooms.find(r => r.id === selectedRoom)

    if (bookingSuccess) {
        return (
            <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold">Booking Confirmed! 🎉</h2>
                <p className="text-muted-foreground mt-2">
                    Your stay at <strong>{hotel.name}</strong> ({selectedRoomData?.name}) has been booked
                    from <strong>{checkIn}</strong> to <strong>{checkOut}</strong>.
                </p>
                <div className="flex gap-3 justify-center mt-8">
                    <Button onClick={() => router.push('/guest/bookings')}>View My Bookings</Button>
                    <Button variant="outline" onClick={() => router.push('/guest/hotels')}>Browse More Hotels</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => router.push('/guest/hotels')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Hotels
            </Button>

            {/* Hotel Header */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="text-9xl text-center md:text-left">{hotel.image}</div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{hotel.name}</h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" /> {hotel.location}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        <Badge variant="outline" className="text-amber-600 text-sm">
                            <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
                            {hotel.rating}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{hotel.reviews} reviews</span>
                    </div>
                    <p className="mt-4 text-muted-foreground">{hotel.description}</p>
                </div>
            </div>

            {/* Amenities */}
            <Card>
                <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {hotel.amenities.map(a => {
                            const Icon = amenityIcons[a] || CheckCircle2
                            return (
                                <div key={a} className="flex items-center gap-2 text-sm">
                                    <Icon className="h-4 w-4 text-primary" />
                                    {a}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Rooms */}
            <Card>
                <CardHeader><CardTitle>Available Rooms</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {hotel.rooms.map(room => (
                        <div
                            key={room.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRoom === room.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                                }`}
                            onClick={() => setSelectedRoom(room.id)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-lg">{room.name}</h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {room.bed}</span>
                                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Up to {room.maxGuests}</span>
                                        <span>{room.size}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {room.features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">${room.price}</p>
                                    <p className="text-xs text-muted-foreground">per night</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Booking Form */}
            <Card className="border-primary/20">
                <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Book Your Stay</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1.5">Check-in</label>
                            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1.5">Check-out</label>
                            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1.5">Guests</label>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" onClick={() => setGuests(Math.max(1, guests - 1))}><Minus className="h-4 w-4" /></Button>
                                <span className="font-semibold text-lg w-8 text-center">{guests}</span>
                                <Button variant="outline" size="icon" onClick={() => setGuests(Math.min(selectedRoomData?.maxGuests || 4, guests + 1))}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" size="lg" onClick={handleBook} disabled={!selectedRoom}>
                                {selectedRoom ? `Book ${selectedRoomData?.name}` : 'Select a Room'}
                            </Button>
                        </div>
                    </div>
                    {selectedRoom && checkIn && checkOut && (
                        <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                            <strong>Summary:</strong> {selectedRoomData?.name} • {checkIn} → {checkOut} •
                            {' '}{(() => { const d = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000); return d > 0 ? `${d} night${d > 1 ? 's' : ''} • $${(selectedRoomData?.price || 0) * d}` : 'Invalid dates' })()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
