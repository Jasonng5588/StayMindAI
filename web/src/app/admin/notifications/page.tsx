"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus, Send, Trash2, Loader2, CheckCheck, Users, Search, X } from 'lucide-react'

interface Notification {
    id: string; user_id: string; type: string; title: string; message: string
    is_read: boolean; created_at: string; metadata?: Record<string, unknown>
}
interface Guest { id: string; email: string; full_name: string }

const typeColors: Record<string, string> = {
    info: 'secondary', booking: 'default', support: 'warning',
    loyalty: 'success', voucher: 'destructive', reward: 'success',
}
const typeIcons: Record<string, string> = { info: 'ℹ️', booking: '🏨', support: '🎧', loyalty: '⭐', voucher: '🎟️', reward: '🎁' }

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [guests, setGuests] = useState<Guest[]>([])
    const [loading, setLoading] = useState(true)
    const [showSend, setShowSend] = useState(false)
    const [search, setSearch] = useState('')
    const [guestSearch, setGuestSearch] = useState('')
    const [form, setForm] = useState({ user_id: '', type: 'info', title: '', message: '' })
    const [sending, setSending] = useState(false)
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch all guests — /api/admin/data?type=customers returns { profiles, bookings, points }
            const gRes = await fetch('/api/admin/data?type=customers')
            if (gRes.ok) {
                const d = await gRes.json()
                const raw = d.profiles || d.users || d.customers || []
                setGuests(raw.map((p: Record<string, unknown>) => ({ id: p.id, email: p.email, full_name: p.full_name })))
            }

            // Fetch all notifications via admin endpoint
            const nRes = await fetch('/api/admin/notifications')
            if (nRes.ok) { const d = await nRes.json(); setNotifications(d.notifications || []) }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const sendNotification = async () => {
        if (!form.user_id || !form.title || !form.message) return
        setSending(true)
        try {
            // Use admin endpoint — bypasses Supabase user auth requirement
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                setShowSend(false)
                setForm({ user_id: '', type: 'info', title: '', message: '' })
                setSelectedGuest(null)
                setGuestSearch('')
                fetchData()
            } else {
                const err = await res.json()
                alert('Failed: ' + (err.error || 'Unknown error'))
            }
        } catch (err) { console.error(err) }
        setSending(false)
    }

    const deleteNotification = async (id: string) => {
        await fetch('/api/admin/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const clearAll = async (userId: string) => {
        if (!confirm('Clear all notifications for this user?')) return
        await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
        fetchData()
    }

    const selectGuest = (g: Guest) => {
        setSelectedGuest(g)
        setForm(f => ({ ...f, user_id: g.id }))
        setGuestSearch(g.full_name || g.email)
    }

    const filteredNotifications = notifications.filter(n =>
        !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
    )
    const filteredGuests = guests.filter(g =>
        guestSearch.length > 0 &&
        (g.full_name?.toLowerCase().includes(guestSearch.toLowerCase()) ||
            g.email?.toLowerCase().includes(guestSearch.toLowerCase()))
    )

    const stats = [
        { label: 'Total Sent', value: notifications.length },
        { label: 'Unread', value: notifications.filter(n => !n.is_read).length },
        { label: 'Support', value: notifications.filter(n => n.type === 'support').length },
        { label: 'Vouchers', value: notifications.filter(n => n.type === 'voucher').length },
    ]

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10"><Bell className="h-5 w-5 text-blue-600" /></div>
                    <div><h1 className="text-2xl font-bold tracking-tight">Notification Management</h1><p className="text-muted-foreground">Send and manage guest notifications</p></div>
                </div>
                <Button onClick={() => setShowSend(true)}><Plus className="h-4 w-4 mr-2" />Send Notification</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(s => (
                    <Card key={s.label}><CardContent className="p-4"><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
                ))}
            </div>

            {/* Send Form */}
            {showSend && (
                <Card className="border-primary/30">
                    <CardHeader><CardTitle className="flex items-center justify-between">
                        <span>Send Notification</span>
                        <Button variant="ghost" size="sm" onClick={() => { setShowSend(false); setSelectedGuest(null); setGuestSearch('') }}><X className="h-4 w-4" /></Button>
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* Guest picker */}
                        <div>
                            <label className="text-sm font-medium block mb-1">Send to Guest *</label>
                            <div className="relative">
                                <Input placeholder="Search guest by name or email..." value={guestSearch} onChange={e => { setGuestSearch(e.target.value); if (!e.target.value) { setSelectedGuest(null); setForm(f => ({ ...f, user_id: '' })) } }} />
                                {filteredGuests.length > 0 && !selectedGuest && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredGuests.slice(0, 8).map(g => (
                                            <button key={g.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2" onClick={() => selectGuest(g)}>
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">{g.full_name}</span>
                                                <span className="text-muted-foreground">{g.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedGuest && <p className="text-xs text-emerald-600 mt-1">✓ Sending to: {selectedGuest.full_name} ({selectedGuest.email})</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Type</label>
                                <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    <option value="info">ℹ️ Info</option>
                                    <option value="booking">🏨 Booking</option>
                                    <option value="support">🎧 Support</option>
                                    <option value="loyalty">⭐ Loyalty</option>
                                    <option value="voucher">🎟️ Voucher</option>
                                    <option value="reward">🎁 Reward</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Title *</label>
                                <Input placeholder="Notification title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Message *</label>
                            <textarea className="w-full min-h-[100px] p-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Notification message..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={sendNotification} disabled={!form.user_id || !form.title || !form.message || sending}>
                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send
                            </Button>
                            <Button variant="outline" onClick={() => { setShowSend(false); setSelectedGuest(null); setGuestSearch('') }}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notification Feed */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map(n => {
                                const guest = guests.find(g => g.id === n.user_id)
                                return (
                                    <div key={n.id} className={`p-4 flex items-start gap-3 ${n.is_read ? 'opacity-70' : 'bg-muted/20'}`}>
                                        <span className="text-xl">{typeIcons[n.type] || '🔔'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={typeColors[n.type] as any} className="text-[10px]">{n.type}</Badge>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
                                                {guest && <span className="text-xs text-muted-foreground">→ {guest.full_name || guest.email}</span>}
                                            </div>
                                            <p className="font-semibold text-sm mt-1">{n.title}</p>
                                            <p className="text-xs text-muted-foreground">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="sm" onClick={() => deleteNotification(n.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
