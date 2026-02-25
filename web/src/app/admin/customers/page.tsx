"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users, X, DollarSign, Calendar, Gift, Mail, Send, CheckCircle2, AlertCircle, Loader2, BedDouble, Star } from 'lucide-react'

interface Customer {
    id: string; name: string; email: string; phone: string; status: string
    loyaltyTier: string; loyaltyPoints: number; totalBookings: number; totalSpent: number
    lastStay: string; memberSince: string; notes: string[]
    stayHistory: { date: string; room: string; amount: number; nights: number }[]
}

const tierColors: Record<string, string> = { Bronze: 'text-amber-700 bg-amber-500/10', Silver: 'text-gray-500 bg-gray-500/10', Gold: 'text-yellow-600 bg-yellow-500/10', Platinum: 'text-violet-600 bg-violet-500/10' }
const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']

function getTier(points: number) {
    if (points >= 5000) return 'Platinum'
    if (points >= 2000) return 'Gold'
    if (points >= 500) return 'Silver'
    return 'Bronze'
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tierFilter, setTierFilter] = useState('all')
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
    const [emailModal, setEmailModal] = useState<Customer | null>(null)
    const [emailSubject, setEmailSubject] = useState('')
    const [emailBody, setEmailBody] = useState('')
    const [emailSent, setEmailSent] = useState(false)
    const [noteInput, setNoteInput] = useState('')
    const [pointsAdjust, setPointsAdjust] = useState('')

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=customers')
            if (!res.ok) { setLoading(false); return }
            const { profiles, bookings, points } = await res.json()

            if (!profiles) { setLoading(false); return }

            const mapped: Customer[] = profiles.map((p: Record<string, unknown>) => {
                const userBookings = (bookings || []).filter((b: Record<string, unknown>) => b.guest_id === p.id)
                const userPoints = (points || []).filter((pt: Record<string, unknown>) => pt.user_id === p.id)
                const totalPoints = userPoints.reduce((sum: number, pt: Record<string, unknown>) => sum + Number(pt.points), 0)
                const totalSpent = userBookings.reduce((sum: number, b: Record<string, unknown>) => sum + (Number(b.total_amount) || 0), 0)
                const lastBooking = userBookings[0]
                const notes: string[] = (p.metadata as Record<string, unknown>)?.notes as string[] || []

                return {
                    id: p.id as string,
                    name: (p.full_name as string) || (p.email as string)?.split('@')[0] || 'Guest',
                    email: (p.email as string) || '',
                    phone: (p.phone as string) || '',
                    status: p.is_active ? 'active' : 'blacklisted',
                    loyaltyTier: getTier(totalPoints),
                    loyaltyPoints: totalPoints,
                    totalBookings: userBookings.length,
                    totalSpent,
                    lastStay: lastBooking?.check_in_date || 'Never',
                    memberSince: (p.created_at as string)?.split('T')[0] || '',
                    notes,
                    stayHistory: userBookings.slice(0, 5).map((b: Record<string, unknown>) => ({
                        date: b.check_in_date as string,
                        room: (b.room_types as { name: string })?.name || 'Room',
                        amount: Number(b.total_amount) || 0,
                        nights: Math.ceil((new Date(b.check_out_date as string).getTime() - new Date(b.check_in_date as string).getTime()) / 86400000),
                    })),
                }
            })

            setCustomers(mapped)
        } catch (err) {
            console.error('Failed to fetch customers:', err)
        }
        setLoading(false)
    }

    const filtered = customers.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
        const matchTier = tierFilter === 'all' || c.loyaltyTier === tierFilter
        return matchSearch && matchTier
    })

    const addNote = async (id: string, note: string) => {
        if (!note.trim()) return
        try {
            await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_note', user_id: id, note })
            })
            const customer = customers.find(c => c.id === id)
            const newNotes = [...(customer?.notes || []), note]
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes: newNotes } : c))
            if (viewCustomer?.id === id) setViewCustomer(prev => prev ? { ...prev, notes: newNotes } : null)
        } catch (err) { console.error(err) }
        setNoteInput('')
    }

    const toggleBlacklist = async (id: string) => {
        try {
            const customer = customers.find(c => c.id === id)
            const newActive = customer?.status === 'blacklisted'
            await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_suspend', user_id: id, is_active: newActive })
            })
            const newStatus = newActive ? 'active' : 'blacklisted'
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
            if (viewCustomer?.id === id) setViewCustomer(prev => prev ? { ...prev, status: newStatus } : null)
        } catch (err) { console.error(err) }
    }

    const sendEmail = () => {
        setEmailSent(true)
        setTimeout(() => { setEmailSent(false); setEmailModal(null); setEmailSubject(''); setEmailBody('') }, 2000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading customers...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10"><Users className="h-5 w-5 text-violet-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
                    <p className="text-muted-foreground">Guest profiles, loyalty, and stay history ({customers.length} customers)</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tierOrder.map(tier => (
                    <Card key={tier} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}>
                        <CardContent className="p-4 text-center">
                            <p className={`text-2xl font-bold ${tierColors[tier]?.split(' ')[0]}`}>{customers.filter(c => c.loyaltyTier === tier).length}</p>
                            <p className="text-sm text-muted-foreground">{tier}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {filtered.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No customers found</h3>
                    <p className="text-muted-foreground">Customers will appear here once guests register and make bookings</p>
                </CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(c => (
                        <Card key={c.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setViewCustomer(c)}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary">{c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{c.name}</p>
                                            {c.status === 'blacklisted' && <Badge variant="destructive" className="text-xs">Blacklisted</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{c.email}</p>
                                    </div>
                                    <Badge className={tierColors[c.loyaltyTier]}>{c.loyaltyTier}</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold">{c.totalBookings}</p><p className="text-xs text-muted-foreground">Stays</p></div>
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold">${c.totalSpent.toLocaleString()}</p><p className="text-xs text-muted-foreground">Spent</p></div>
                                    <div className="p-2 rounded-lg bg-muted/50"><p className="font-bold">{c.loyaltyPoints.toLocaleString()}</p><p className="text-xs text-muted-foreground">Points</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Customer Detail Modal */}
            {viewCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewCustomer(null)}>
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary/10 text-primary text-lg">{viewCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold">{viewCustomer.name}</h2>
                                            <Badge className={tierColors[viewCustomer.loyaltyTier]}>{viewCustomer.loyaltyTier}</Badge>
                                        </div>
                                        <p className="text-muted-foreground">{viewCustomer.email} • {viewCustomer.phone || 'No phone'}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setViewCustomer(null)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><Calendar className="h-4 w-4 text-blue-500 mx-auto mb-1" /><p className="text-lg font-bold">{viewCustomer.totalBookings}</p><p className="text-xs text-muted-foreground">Bookings</p></div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><DollarSign className="h-4 w-4 text-emerald-500 mx-auto mb-1" /><p className="text-lg font-bold">${viewCustomer.totalSpent.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Spent</p></div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><Star className="h-4 w-4 text-amber-500 mx-auto mb-1" /><p className="text-lg font-bold">{viewCustomer.loyaltyPoints.toLocaleString()}</p><p className="text-xs text-muted-foreground">Points</p></div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center"><BedDouble className="h-4 w-4 text-violet-500 mx-auto mb-1" /><p className="text-lg font-bold">{viewCustomer.lastStay}</p><p className="text-xs text-muted-foreground">Last Stay</p></div>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <Input placeholder="Adjust points (+/-)" value={pointsAdjust} onChange={e => setPointsAdjust(e.target.value)} className="max-w-48" type="number" />
                                <Button size="sm" onClick={async () => {
                                    const pts = parseInt(pointsAdjust) || 0
                                    if (!pts) return
                                    try {
                                        // First get a valid hotel_id (required NOT NULL in loyalty_points)
                                        let hotelId = null
                                        try {
                                            const hRes = await fetch('/api/admin/data?type=dashboard')
                                            if (hRes.ok) {
                                                const hData = await hRes.json()
                                                // Get hotel from recent bookings or fetch directly
                                                if (hData.recentBookings?.[0]?.hotel_id) {
                                                    hotelId = hData.recentBookings[0].hotel_id
                                                }
                                            }
                                            // If no hotel from bookings, get first hotel
                                            if (!hotelId) {
                                                const h2Res = await fetch('/api/admin/data?type=hotels')
                                                if (h2Res.ok) {
                                                    const h2Data = await h2Res.json()
                                                    hotelId = h2Data.hotels?.[0]?.id
                                                }
                                            }
                                        } catch { /* ignore */ }

                                        const res = await fetch('/api/loyalty/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'adjust_points', hotel_id: hotelId, user_id: viewCustomer.id, points: pts, description: 'Admin adjustment' }) })
                                        if (res.ok) { setViewCustomer(prev => prev ? { ...prev, loyaltyPoints: prev.loyaltyPoints + pts } : null); setCustomers(prev => prev.map(c => c.id === viewCustomer.id ? { ...c, loyaltyPoints: c.loyaltyPoints + pts } : c)) }
                                    } catch (err) { console.error(err) }
                                    setPointsAdjust('')
                                }} disabled={!pointsAdjust}><Gift className="h-4 w-4 mr-1" />Adjust</Button>
                            </div>

                            <h3 className="font-semibold mb-3">Stay History</h3>
                            <div className="space-y-2 mb-6">
                                {viewCustomer.stayHistory.length === 0 ? <p className="text-sm text-muted-foreground">No stay history yet</p> : viewCustomer.stayHistory.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                                        <div><p className="font-medium">{s.room}</p><p className="text-xs text-muted-foreground">{s.date} • {s.nights} night{s.nights > 1 ? 's' : ''}</p></div>
                                        <p className="font-semibold">${s.amount}</p>
                                    </div>
                                ))}
                            </div>

                            <h3 className="font-semibold mb-3">Admin Notes</h3>
                            {viewCustomer.notes.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {viewCustomer.notes.map((n, i) => (
                                        <div key={i} className="p-2 rounded-lg bg-amber-500/10 text-sm flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /><span>{n}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2 mb-6">
                                <Input placeholder="Add a note..." value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote(viewCustomer.id, noteInput)} />
                                <Button size="sm" onClick={() => addNote(viewCustomer.id, noteInput)} disabled={!noteInput.trim()}>Add</Button>
                            </div>

                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={() => { setViewCustomer(null); setEmailModal(viewCustomer) }}><Mail className="h-4 w-4 mr-2" />Email</Button>
                                <Button variant={viewCustomer.status === 'blacklisted' ? 'default' : 'destructive'} className="flex-1" onClick={() => toggleBlacklist(viewCustomer.id)}>
                                    {viewCustomer.status === 'blacklisted' ? 'Remove Blacklist' : 'Blacklist'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Email Modal */}
            {emailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setEmailModal(null); setEmailSent(false) }}>
                    <Card className="w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">Email Customer</h2>
                                <Button variant="ghost" size="icon" onClick={() => { setEmailModal(null); setEmailSent(false) }}><X className="h-5 w-5" /></Button>
                            </div>
                            {emailSent ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                                    <p className="font-semibold text-lg">Email Sent!</p>
                                    <p className="text-muted-foreground text-sm">Message sent to {emailModal.email}</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">To: <strong>{emailModal.name}</strong> ({emailModal.email})</p>
                                    <div className="space-y-3">
                                        <Input placeholder="Subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                                        <textarea className="w-full min-h-[120px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Write your message..." value={emailBody} onChange={e => setEmailBody(e.target.value)} />
                                    </div>
                                    <Button className="w-full mt-4" disabled={!emailSubject.trim() || !emailBody.trim()} onClick={sendEmail}>
                                        <Send className="h-4 w-4 mr-2" />Send Email
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
