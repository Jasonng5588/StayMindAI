"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle, Clock, CheckCircle2, User, Send, X, AlertCircle, LifeBuoy, Loader2 } from 'lucide-react'

interface Message { role: 'guest' | 'admin'; text: string; time: string; sender_name?: string }
interface Ticket {
    id: string; subject: string; from: string; email: string; category: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    created_at: string; messages: Message[]; resolution_note?: string
}

const statusColors: Record<string, string> = { open: 'destructive', in_progress: 'warning', resolved: 'success', closed: 'secondary' }
const priorityColors: Record<string, string> = { low: 'secondary', medium: 'warning', high: 'destructive', critical: 'destructive' }

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Ticket | null>(null)
    const [replyText, setReplyText] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sending, setSending] = useState(false)

    useEffect(() => { fetchTickets() }, [])

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=support')
            if (!res.ok) { setLoading(false); return }
            const { tickets: ticketData } = await res.json()

            if (ticketData) {
                const mapped: Ticket[] = await Promise.all(ticketData.map(async (t: Record<string, unknown>) => {
                    const profile = t.profiles as { full_name: string; email: string } | null

                    // Fetch messages through API
                    let messages: Message[] = []
                    try {
                        const msgRes = await fetch(`/api/support/messages?ticket_id=${t.id}`)
                        if (msgRes.ok) {
                            const { messages: msgs } = await msgRes.json()
                            messages = (msgs || []).map((m: Record<string, unknown>) => ({
                                role: m.role as 'guest' | 'admin',
                                text: m.message as string,
                                time: new Date(m.created_at as string).toLocaleString(),
                                sender_name: (m.profiles as { full_name: string })?.full_name,
                            }))
                        }
                    } catch { /* ignore */ }

                    return {
                        id: t.id as string,
                        subject: t.subject as string,
                        from: profile?.full_name || 'Guest',
                        email: profile?.email || '',
                        category: (t.category as string) || 'General',
                        priority: t.priority as Ticket['priority'],
                        status: t.status as Ticket['status'],
                        created_at: t.created_at as string,
                        resolution_note: t.resolution as string | undefined,
                        messages,
                    }
                }))
                setTickets(mapped)
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const sendAdminReply = async () => {
        if (!replyText.trim() || !selected) return
        setSending(true)
        try {
            const res = await fetch('/api/support/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, message: replyText, role: 'admin' })
            })
            if (res.ok) {
                const newMsg: Message = { role: 'admin', text: replyText, time: new Date().toLocaleString() }
                const updated = { ...selected, messages: [...selected.messages, newMsg], status: 'in_progress' as const }
                setSelected(updated)
                setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
            }
        } catch (err) { console.error(err) }
        setReplyText('')
        setSending(false)
    }

    const resolveTicket = async () => {
        if (!selected) return
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, status: 'resolved', resolution: 'Resolved by admin' })
            })
            if (res.ok) {
                const updated = { ...selected, status: 'resolved' as const }
                setSelected(updated)
                setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
            }
        } catch (err) { console.error(err) }
    }

    const reopenTicket = async () => {
        if (!selected) return
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, status: 'open' })
            })
            if (res.ok) {
                const updated = { ...selected, status: 'open' as const }
                setSelected(updated)
                setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
            }
        } catch (err) { console.error(err) }
    }

    const changePriority = async (priority: Ticket['priority']) => {
        if (!selected) return
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, priority })
            })
            if (res.ok) {
                const updated = { ...selected, priority }
                setSelected(updated)
                setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
            }
        } catch (err) { console.error(err) }
    }

    const filtered = tickets.filter(t => {
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || t.status === statusFilter
        return matchSearch && matchStatus
    })

    const counts = { open: tickets.filter(t => t.status === 'open').length, in_progress: tickets.filter(t => t.status === 'in_progress').length, resolved: tickets.filter(t => t.status === 'resolved').length }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading tickets...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><LifeBuoy className="h-5 w-5 text-red-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
                    <p className="text-muted-foreground">Manage guest tickets & live chat</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer" onClick={() => setStatusFilter('open')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{counts.open}</p><p className="text-sm text-muted-foreground">Open</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter('in_progress')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500">{counts.in_progress}</p><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter('resolved')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-500">{counts.resolved}</p><p className="text-sm text-muted-foreground">Resolved</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setStatusFilter('all')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{tickets.length}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                    {['all', 'open', 'in_progress', 'resolved'].map(s => (
                        <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
                            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Split Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
                {/* Ticket List */}
                <div className="space-y-2 lg:col-span-1">
                    {filtered.length === 0 ? (
                        <Card><CardContent className="p-8 text-center">
                            <LifeBuoy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No tickets found</p>
                        </CardContent></Card>
                    ) : filtered.map(t => (
                        <Card key={t.id} className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === t.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected(t)}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground font-mono">{t.id.slice(0, 8)}</span>
                                    <Badge variant={priorityColors[t.priority] as 'destructive' | 'warning' | 'secondary'} className="text-[10px]">{t.priority}</Badge>
                                    <Badge variant={statusColors[t.status] as 'destructive' | 'warning' | 'success' | 'secondary'} className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                                </div>
                                <p className="font-semibold text-sm">{t.subject}</p>
                                <p className="text-xs text-muted-foreground">{t.from} • 💬 {t.messages.length}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2">
                    {!selected ? (
                        <Card className="h-full flex items-center justify-center"><CardContent className="text-center p-8">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Select a ticket to start chatting</p>
                        </CardContent></Card>
                    ) : (
                        <Card className="h-full flex flex-col">
                            <CardContent className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{selected.subject}</h3>
                                        <p className="text-sm text-muted-foreground">{selected.from} ({selected.email}) • {selected.category}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <select className="text-xs border rounded px-2 py-1 bg-background" value={selected.priority} onChange={e => changePriority(e.target.value as Ticket['priority'])}>
                                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                                        </select>
                                        {selected.status !== 'resolved' ? (
                                            <Button size="sm" variant="outline" onClick={resolveTicket}><CheckCircle2 className="h-3 w-3 mr-1" />Resolve</Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={reopenTicket}><AlertCircle className="h-3 w-3 mr-1" />Reopen</Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                                {selected.messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="font-medium text-xs mb-1">{m.role === 'admin' ? 'Admin' : m.sender_name || selected.from}</p>
                                            <p>{m.text}</p>
                                            <p className={`text-[10px] mt-1 ${m.role === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {selected.messages.length === 0 && <p className="text-center text-muted-foreground text-sm">No messages yet. Send a reply to start the conversation.</p>}
                            </div>

                            {/* Reply */}
                            {selected.status !== 'resolved' && (
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input placeholder="Type a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAdminReply()} />
                                        <Button onClick={sendAdminReply} disabled={!replyText.trim() || sending}>
                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
