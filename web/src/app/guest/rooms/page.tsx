"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    BedDouble, Users, Check, Calendar, Minus, Plus as PlusIcon,
    ChevronDown, ChevronUp, CheckCircle2, CreditCard, Lock, Loader2, ArrowLeft,
    Wallet, QrCode, Building, Smartphone,
} from 'lucide-react'

interface RoomType {
    id: string; name: string; description: string; price: number; originalPrice: number
    maxOccupancy: number; bedType: string; size: string; available: number
    amenities: string[]; image: string; hotelId: string
}

type Step = 'select' | 'payment' | 'success'
type PaymentMethod = 'card' | 'tng' | 'duitnow' | 'fpx'

const paymentMethods = [
    { id: 'card' as const, name: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, AMEX', color: 'text-blue-600 bg-blue-500/10' },
    { id: 'tng' as const, name: 'TNG eWallet', icon: Wallet, desc: "Touch 'n Go eWallet", color: 'text-blue-500 bg-blue-500/10' },
    { id: 'duitnow' as const, name: 'DuitNow QR', icon: QrCode, desc: 'Scan & pay with any bank', color: 'text-pink-600 bg-pink-500/10' },
    { id: 'fpx' as const, name: 'FPX Online Banking', icon: Building, desc: 'Direct bank transfer', color: 'text-emerald-600 bg-emerald-500/10' },
]

const fpxBanks = ['Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank', 'AmBank', 'Bank Islam', 'Bank Rakyat']

const roomEmojis: Record<string, string> = {
    standard: '🏨', deluxe: '🌊', suite: '🌴', presidential: '👑', superior: '⭐', family: '👨‍👩‍👧‍👦'
}

export default function GuestRoomsPage() {
    const [step, setStep] = useState<Step>('select')
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [guests, setGuests] = useState(2)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

    // Card payment fields
    const [cardNumber, setCardNumber] = useState('')
    const [cardName, setCardName] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvv, setCvv] = useState('')

    // FPX field
    const [selectedBank, setSelectedBank] = useState('')

    const [paymentLoading, setPaymentLoading] = useState(false)
    const [paymentError, setPaymentError] = useState('')
    const [bookingNumber, setBookingNumber] = useState('')

    // Fetch rooms from API
    const [rooms, setRooms] = useState<RoomType[]>([])
    const [roomsLoading, setRoomsLoading] = useState(true)

    useEffect(() => {
        const fetchRooms = async () => {
            setRoomsLoading(true)
            try {
                const res = await fetch('/api/admin/data?type=rooms')
                if (!res.ok) { setRoomsLoading(false); return }
                const { rooms: data } = await res.json()
                if (data && data.length > 0) {
                    setRooms(data.map((r: Record<string, unknown>) => {
                        const roomType = (r.room_type as string) || 'standard'
                        return {
                            id: r.id as string,
                            name: (r.name as string) || `Room ${r.room_number}`,
                            description: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} room on floor ${r.floor || 1}`,
                            price: Number(r.base_price) || 179,
                            originalPrice: Math.round((Number(r.base_price) || 179) * 1.15),
                            maxOccupancy: roomType.includes('suite') ? 4 : 2,
                            bedType: roomType.includes('suite') ? 'King Bed + Sofa' : roomType.includes('deluxe') ? 'King Bed' : 'Queen Bed',
                            size: roomType.includes('suite') ? '65m²' : roomType.includes('deluxe') ? '42m²' : '28m²',
                            available: r.status === 'available' ? 1 : 0,
                            amenities: ['Free Wi-Fi', 'Smart TV', 'Air Conditioning', 'Mini Bar', 'Room Service'],
                            image: roomEmojis[roomType] || '🏨',
                            hotelId: r.hotel_id as string,
                        }
                    }))
                }
            } catch (err) { console.error('Failed to fetch rooms:', err) }
            setRoomsLoading(false)
        }
        fetchRooms()
    }, [])

    const nights = checkIn && checkOut
        ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
        : 1

    const selectedRoomData = rooms.find(r => r.id === selectedRoom)
    const totalAmount = (selectedRoomData?.price || 0) * nights

    const formatCard = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16)
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
    }

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 4)
        if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
        return digits
    }

    const handleProceedToPayment = () => {
        if (!checkIn || !checkOut) { alert('Please select check-in and check-out dates'); return }
        if (!selectedRoom) { alert('Please select a room'); return }
        setStep('payment')
    }

    const handlePayment = async () => {
        setPaymentError('')

        if (paymentMethod === 'card') {
            const cardDigits = cardNumber.replace(/\s/g, '')
            if (cardDigits.length < 13) { setPaymentError('Please enter a valid card number'); return }
            if (!cardName.trim()) { setPaymentError('Please enter the cardholder name'); return }
            if (expiry.length < 5) { setPaymentError('Please enter a valid expiry date (MM/YY)'); return }
            if (cvv.length < 3) { setPaymentError('Please enter a valid CVV'); return }
            const [mm, yy] = expiry.split('/')
            const expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1)
            if (expDate < new Date()) { setPaymentError('Card has expired'); return }
        } else if (paymentMethod === 'fpx') {
            if (!selectedBank) { setPaymentError('Please select your bank'); return }
        }

        setPaymentLoading(true)
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotel_id: selectedRoomData?.hotelId,
                    room_id: selectedRoom,
                    check_in: checkIn,
                    check_out: checkOut,
                    guests,
                    total_amount: totalAmount,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setPaymentError(data.error || 'Booking failed. Please try again.')
                setPaymentLoading(false)
                return
            }
            setBookingNumber(data.confirmation_code || data.booking?.booking_number || '')
            setStep('success')
        } catch (err) {
            console.error(err)
            setPaymentError('Network error. Please try again.')
        }
        setPaymentLoading(false)
    }

    const methodLabel = paymentMethods.find(m => m.id === paymentMethod)?.name || 'Card'

    const resetForm = () => {
        setStep('select'); setSelectedRoom(null)
        setCardNumber(''); setCardName(''); setExpiry(''); setCvv('')
        setPaymentMethod('card'); setSelectedBank('')
    }

    // === SUCCESS SCREEN ===
    if (step === 'success') {
        return (
            <div className="max-w-lg mx-auto text-center py-12 sm:py-16 px-4 animate-fade-in">
                <div className="p-4 rounded-full bg-emerald-500/10 w-fit mx-auto mb-4">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
                <p className="text-lg font-semibold text-primary mt-2">Payment of ${totalAmount} successful</p>
                <p className="text-muted-foreground mt-2">
                    Your <span className="font-semibold text-foreground">{selectedRoomData?.name}</span> has been booked
                    for {nights} night{nights > 1 ? 's' : ''}.
                </p>
                <p className="text-muted-foreground mt-1">{checkIn} → {checkOut} • {guests} guest{guests > 1 ? 's' : ''}</p>

                <div className="mt-4 p-4 rounded-xl bg-muted/50 text-sm text-left space-y-1">
                    <p><span className="text-muted-foreground">Booking ID:</span> <span className="font-mono font-semibold">{bookingNumber}</span></p>
                    <p><span className="text-muted-foreground">Payment:</span> {methodLabel}</p>
                    {paymentMethod === 'card' && <p><span className="text-muted-foreground">Card:</span> •••• {cardNumber.replace(/\s/g, '').slice(-4)}</p>}
                    {paymentMethod === 'fpx' && <p><span className="text-muted-foreground">Bank:</span> {selectedBank}</p>}
                    <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">RM {totalAmount}</span></p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <Button onClick={resetForm}>Book Another Room</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/guest/bookings'}>View My Bookings</Button>
                </div>
            </div>
        )
    }

    // === PAYMENT SCREEN ===
    if (step === 'payment') {
        return (
            <div className="max-w-lg mx-auto py-6 px-4 animate-fade-in">
                <Button variant="ghost" className="mb-4" onClick={() => setStep('select')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Room Selection
                </Button>

                <h1 className="text-2xl font-bold tracking-tight">Payment</h1>
                <p className="text-muted-foreground mb-6">Complete your booking for {selectedRoomData?.name}</p>

                {/* Order Summary */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">{selectedRoomData?.image}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold">{selectedRoomData?.name}</h3>
                                <p className="text-sm text-muted-foreground">{checkIn} → {checkOut} • {nights} night{nights > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">${selectedRoomData?.price} × {nights} night{nights > 1 ? 's' : ''}</span>
                                <span>${totalAmount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Taxes & fees</span>
                                <span>Included</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-1 border-t mt-2">
                                <span>Total</span>
                                <span className="text-primary">${totalAmount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method Selector */}
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(m => (
                                <button key={m.id}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                                    onClick={() => { setPaymentMethod(m.id); setPaymentError('') }}>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${m.color}`}><m.icon className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium">{m.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Form */}
                <Card>
                    <CardContent className="p-5 space-y-4">
                        {paymentError && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{paymentError}</div>
                        )}

                        {paymentMethod === 'card' && (
                            <>
                                <div>
                                    <label className="text-sm font-medium block mb-1.5">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="1234 5678 9012 3456" value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCard(e.target.value))} className="pl-9" maxLength={19} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1.5">Cardholder Name</label>
                                    <Input placeholder="JOHN DOE" value={cardName}
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium block mb-1.5">Expiry</label>
                                        <Input placeholder="MM/YY" value={expiry}
                                            onChange={(e) => setExpiry(formatExpiry(e.target.value))} maxLength={5} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium block mb-1.5">CVV</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" placeholder="•••" value={cvv}
                                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="pl-9" maxLength={4} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {paymentMethod === 'tng' && (
                            <div className="text-center py-6 space-y-3">
                                <div className="p-4 rounded-xl bg-blue-500/10 w-fit mx-auto">
                                    <Wallet className="h-12 w-12 text-blue-500" />
                                </div>
                                <h3 className="font-semibold text-lg">TNG eWallet</h3>
                                <p className="text-sm text-muted-foreground">You will be redirected to Touch 'n Go eWallet to complete your payment of <strong>${totalAmount}</strong></p>
                                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                                    <Smartphone className="h-3 w-3" />
                                    <span>Make sure your TNG eWallet app is installed</span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'duitnow' && (
                            <div className="text-center py-6 space-y-3">
                                <div className="p-6 rounded-2xl bg-muted/50 w-48 h-48 mx-auto flex items-center justify-center border-2 border-dashed">
                                    <div className="text-center">
                                        <QrCode className="h-16 w-16 text-pink-600 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">QR code will appear</p>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-lg">DuitNow QR</h3>
                                <p className="text-sm text-muted-foreground">A QR code will be generated for you to scan with your banking app to pay <strong>${totalAmount}</strong></p>
                            </div>
                        )}

                        {paymentMethod === 'fpx' && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">Select Your Bank</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {fpxBanks.map(bank => (
                                        <button key={bank}
                                            className={`p-3 rounded-lg border-2 text-sm text-left transition-all flex items-center gap-2 ${selectedBank === bank ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                                            onClick={() => { setSelectedBank(bank); setPaymentError('') }}>
                                            <Building className="h-4 w-4 text-emerald-600" />
                                            {bank}
                                            {selectedBank === bank && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground text-center">You will be redirected to your bank to authorize the payment</p>
                            </div>
                        )}

                        <Button className="w-full" size="lg" onClick={handlePayment} disabled={paymentLoading}>
                            {paymentLoading ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing Payment...</>
                            ) : (
                                <><Lock className="h-4 w-4 mr-2" />Pay ${totalAmount} via {methodLabel}</>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Secured with 256-bit encryption
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // === ROOM SELECTION SCREEN ===
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Book a Room</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Choose from our available rooms and suites</p>
            </div>

            {/* Date & Guest Picker */}
            <Card>
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium block mb-1.5">Check-in</label>
                            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium block mb-1.5">Check-out</label>
                            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                                min={checkIn || new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium block mb-1.5">Guests</label>
                            <div className="flex items-center gap-3 h-10 px-3 border rounded-lg">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setGuests(Math.max(1, guests - 1))}><Minus className="h-4 w-4" /></Button>
                                <span className="font-medium flex-1 text-center">{guests}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setGuests(Math.min(6, guests + 1))}><PlusIcon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    {checkIn && checkOut && (
                        <p className="text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4 inline mr-1" />{nights} night{nights > 1 ? 's' : ''}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Accepted Payment Methods Bar */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
                <span>Accepted:</span>
                {paymentMethods.map(m => (
                    <span key={m.id} className="flex items-center gap-1"><m.icon className="h-3.5 w-3.5" />{m.name}</span>
                ))}
            </div>

            {/* Room Cards */}
            <div className="space-y-4">
                {rooms.filter(r => r.maxOccupancy >= guests).map(room => {
                    const isSelected = selectedRoom === room.id
                    const isExpanded = expandedRoom === room.id
                    return (
                        <Card
                            key={room.id}
                            className={`transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-lg'}`}
                            onClick={() => setSelectedRoom(room.id)}
                        >
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-40 h-32 sm:h-auto bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl sm:text-5xl rounded-t-lg sm:rounded-none sm:rounded-l-lg">
                                        {room.image}
                                    </div>
                                    <div className="flex-1 p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base sm:text-lg font-bold">{room.name}</h3>
                                                    {isSelected && <Badge className="bg-primary text-xs">Selected</Badge>}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                                            </div>
                                            <div className="sm:text-right">
                                                {room.originalPrice > room.price && (
                                                    <p className="text-sm text-muted-foreground line-through">${room.originalPrice}</p>
                                                )}
                                                <p className="text-xl sm:text-2xl font-bold text-primary">${room.price}</p>
                                                <p className="text-xs text-muted-foreground">per night</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs sm:text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {room.bedType}</span>
                                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Max {room.maxOccupancy}</span>
                                            <span>{room.size}</span>
                                            <Badge variant={room.available > 0 ? 'success' : 'destructive'} className="text-xs">
                                                {room.available > 0 ? `${room.available} available` : 'Sold out'}
                                            </Badge>
                                        </div>

                                        <Button
                                            variant="ghost" size="sm" className="mt-2 text-xs"
                                            onClick={(e) => { e.stopPropagation(); setExpandedRoom(isExpanded ? null : room.id) }}
                                        >
                                            {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                            {isExpanded ? 'Hide' : 'View'} amenities
                                        </Button>

                                        {isExpanded && (
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                                {room.amenities.map(a => (
                                                    <span key={a} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                                                        <Check className="h-3 w-3 text-primary" />{a}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {isSelected && checkIn && checkOut && (
                                            <div className="mt-3 p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                                                <div className="flex justify-between text-sm">
                                                    <span>${room.price} × {nights} night{nights > 1 ? 's' : ''}</span>
                                                    <span className="font-bold text-base sm:text-lg">${room.price * nights}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {rooms.filter(r => r.maxOccupancy >= guests).length === 0 && (
                    <Card>
                        <CardContent className="p-8 sm:p-12 text-center">
                            <p className="text-muted-foreground">No rooms available for {guests} guests. Try reducing your guest count.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Proceed to Payment */}
            {selectedRoom && (
                <div className="sticky bottom-4 z-10">
                    <Card className="bg-background/95 backdrop-blur-md border-primary/20 shadow-lg">
                        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold">{selectedRoomData?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {checkIn && checkOut ? `${nights} night${nights > 1 ? 's' : ''} • $${totalAmount} total` : 'Select dates to see total'}
                                </p>
                            </div>
                            <Button size="lg" onClick={handleProceedToPayment} disabled={!checkIn || !checkOut} className="w-full sm:w-auto">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Proceed to Payment {checkIn && checkOut ? `— $${totalAmount}` : ''}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
