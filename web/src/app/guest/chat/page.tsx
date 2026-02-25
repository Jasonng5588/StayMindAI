"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    time: string
}

const suggestions = [
    'What rooms are available?',
    'Tell me about the spa',
    'What restaurants do you have?',
    'What time is check-in?',
    'Is there airport transfer?',
    'What activities are nearby?',
]

export default function GuestChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! 👋 I'm your AI Concierge at Grand Azure Resort & Spa. I can help you with room information, hotel amenities, dining, activities, and more. How can I assist you today?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text?: string) => {
        const content = text || input.trim()
        if (!content || loading) return

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        setTimeout(() => {
            const responses: Record<string, string> = {
                'room': "🛏️ We have 4 room types available:\n\n1. **Standard Room** — $179/night, Queen bed, 28m², city views\n2. **Ocean View Deluxe** — $299/night, King bed, 42m², ocean views + balcony\n3. **Garden Suite** — $449/night, King + sofa, 65m², separate living area\n4. **Presidential Suite** — $799/night, King bed, 120m², panoramic views + butler service\n\nWould you like to book one? You can head to **Book a Room** in the menu!",
                'spa': "💆 Our Full-Service Spa is open daily from 9 AM to 8 PM.\n\nPopular treatments:\n• **Hot Stone Massage** (60 min) — $150\n• **Ocean Breeze Facial** (45 min) — $120\n• **Couples Retreat Package** (90 min) — $350\n• **Detox Body Wrap** (60 min) — $130\n\nThe spa also features a sauna, steam room, and relaxation lounge. Would you like to schedule a treatment?",
                'restaurant': "🍽️ We have 3 dining options:\n\n1. **Azure** (Fine Dining) — Seafood & international cuisine, dinner 6-10 PM\n2. **The Garden Café** — Casual all-day dining, 7 AM - 10 PM, breakfast included with your stay\n3. **Sunset Rooftop Bar** — Cocktails & light bites, 4 PM - midnight\n\n**Room service** is available 24/7. Would you like to make a reservation?",
                'check-in': "🕐 **Check-in time**: 3:00 PM\n**Check-out time**: 11:00 AM\n\nEarly check-in (from 12 PM) may be available upon request — just let the front desk know. Late check-out until 2 PM can be arranged for $50.\n\n📞 Front Desk: +1 (305) 555-0100",
                'airport': "✈️ Yes! We offer airport transfer services:\n\n• **Miami International Airport (MIA)** — $60 one-way, 25 min drive\n• **Fort Lauderdale Airport (FLL)** — $85 one-way, 40 min drive\n\nPlease book at least 24 hours in advance. Presidential Suite guests receive complimentary airport transfers.\n\nWould you like me to help arrange a pickup?",
                'activit': "🎯 Popular activities nearby:\n\n1. **Private Beach** — Direct access from the hotel, loungers & umbrellas included\n2. **Snorkeling Tours** — $75/person, depart at 9 AM and 2 PM\n3. **Jet Ski Rental** — $90/hour at the beach\n4. **South Beach** — 10 min walk, shopping & nightlife\n5. **Everglades Tour** — $120/person, full-day excursion\n6. **Art Deco Walking Tour** — Free, every morning at 10:30 AM\n\nThe concierge desk can book any of these for you!",
                'wifi': "📶 **Wi-Fi** is complimentary throughout the entire hotel.\n\n**Network**: Grand Azure Guest\n**Password**: Available at check-in or ask the front desk.\n\nWe also have a business center on the 2nd floor with printing and scanning services.",
                'pool': "🏊 Our pool area features:\n\n• **Infinity Pool** — Heated, open 7 AM - 9 PM\n• **Kids' Pool** — With splash pad area\n• **2 Jacuzzis** — Open until 10 PM\n• **Poolside bar** — Cocktails and snacks\n\nTowels are provided at the pool deck. Cabanas can be reserved for $50/day.",
                'parking': "🚗 We offer:\n\n• **Valet Parking** — $35/night, available 24/7\n• **Self-Parking** — $25/night in the covered garage\n• **EV Charging** — 4 Tesla chargers available (complimentary for guests)\n\nGuests can also use our complimentary shuttle to South Beach and nearby attractions.",
            }

            const lowerContent = content.toLowerCase()
            let response = "Thank you for your question! 😊 Here are some things I can help you with:\n\n🛏️ **Rooms** — types, availability, pricing\n🍽️ **Dining** — restaurants, room service, hours\n💆 **Spa** — treatments and scheduling\n🎯 **Activities** — beach, tours, nearby attractions\n🚗 **Parking** — valet and self-parking\n📶 **Wi-Fi** — network info\n🕐 **Check-in/out** — times and policies\n✈️ **Airport Transfer** — pickup/dropoff\n\nJust ask about any of these topics!"

            for (const [key, val] of Object.entries(responses)) {
                if (lowerContent.includes(key)) { response = val; break }
            }

            setMessages(prev => [...prev, {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }])
            setLoading(false)
        }, 800 + Math.random() * 400)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
            <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" /> AI Concierge
                </h1>
                <p className="text-sm text-muted-foreground">Your personal hotel assistant — Grand Azure Resort & Spa</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500" />
                                </div>
                            )}
                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-muted rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                    {msg.time}
                                </p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500" />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-bl-none p-3">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>

                {messages.length <= 1 && (
                    <div className="px-3 sm:px-4 pb-2">
                        <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map(s => (
                                <Button key={s} variant="outline" size="sm" className="text-xs h-7 sm:h-8" onClick={() => sendMessage(s)}>
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <CardContent className="p-2 sm:p-3 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                        <Input
                            placeholder="Ask about rooms, dining, spa..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1 text-sm"
                        />
                        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
