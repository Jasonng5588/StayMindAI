"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle, CheckCircle2, Send, AlertCircle, LifeBuoy, Loader2 } from 'lucide-react'

interface Message { id: string; role: 'guest' | 'admin'; text: string; time: string; sender_name?: string }
interface Ticket {
    id: string; subject: string; from: string; email: string; category: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    created_at: string; messages: Message[]
}

const statusColors: Record<string, string> = { open: 'destructive', in_progress: 'warning', resolved: 'success', closed: 'secondary' }
const priorityColors: Record<string, string> = { low: 'secondary', medium: 'warning', high: 'destructive', critical: 'destructive' }

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Ticket | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [replyText, setReplyText] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef = useRef<any>(null)
    // Memoize supabase client — MUST not recreate on every render or Realtime breaks
    const supabase = useMemo(() => createClient(), [])

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    useEffect(() => { fetchTickets() }, [])
    useEffect(() => { scrollToBottom() }, [messages])

    // Subscribe to realtime messages when a ticket is selected
    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current as any)
            channelRef.current = null
        }
        if (!selected) return

        // Load messages for selected ticket
        loadMessages(selected.id)

        // Subscribe to new messages on this ticket
        const channel = supabase
            .channel(`ticket-messages-admin-${selected.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${selected.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Record<string, unknown>
                    const msg: Message = {
                        id: newMsg.id as string,
                        role: newMsg.role as 'guest' | 'admin',
                        text: newMsg.message as string,
                        time: new Date(newMsg.created_at as string).toLocaleString(),
                    }
                    setMessages(prev => {
                        // Deduplicate
                        if (prev.some(m => m.id === msg.id)) return prev
                        return [...prev, msg]
                    })
                    scrollToBottom()
                }
            )
            .subscribe()

        channelRef.current = channel as any

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [selected?.id])

    const loadMessages = async (ticketId: string) => {
        try {
            const res = await fetch(`/api/support/messages?ticket_id=${ticketId}`)
            if (res.ok) {
                const { messages: msgs } = await res.json()
                setMessages((msgs || []).map((m: Record<string, unknown>) => ({
                    id: m.id as string,
                    role: m.role as 'guest' | 'admin',
                    text: m.message as string,
                    time: new Date(m.created_at as string).toLocaleString(),
                    sender_name: (m.profiles as { full_name: string } | null)?.full_name,
                })))
            }
        } catch { /* ignore */ }
        setTimeout(scrollToBottom, 100)
    }

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=support')
            if (!res.ok) { setLoading(false); return }
            const { tickets: ticketData } = await res.json()
            if (ticketData) {
                const mapped: Ticket[] = ticketData.map((t: Record<string, unknown>) => {
                    const profile = t.profiles as { full_name: string; email: string } | null
                    return {
                        id: t.id as string,
                        subject: t.subject as string,
                        from: profile?.full_name || 'Guest',
                        email: profile?.email || '',
                        category: (t.category as string) || 'General',
                        priority: t.priority as Ticket['priority'],
                        status: t.status as Ticket['status'],
                        created_at: t.created_at as string,
                        messages: [],
                    }
                })
                setTickets(mapped)
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const selectTicket = (t: Ticket) => {
        setSelected(t)
        setMessages([])
    }

    const sendAdminReply = async () => {
        if (!replyText.trim() || !selected) return
        const text = replyText.trim()
        setReplyText('') // Clear immediately for snappy UX
        setSending(true)
        try {
            // Optimistic update — add message locally immediately
            const optimistic: Message = {
                id: `opt-${Date.now()}`,
                role: 'admin',
                text,
                time: new Date().toLocaleString(),
            }
            setMessages(prev => [...prev, optimistic])
            scrollToBottom()

            const res = await fetch('/api/support/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, message: text, role: 'admin' })
            })
            if (res.ok) {
                // Update ticket status in list
                setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'in_progress' } : t))
                setSelected(prev => prev ? { ...prev, status: 'in_progress' } : null)
            }
        } catch (err) { console.error(err) }
        setSending(false)
    }

    const resolveTicket = async () => {
        if (!selected) return
        try {
            await fetch('/api/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: selected.id, status: 'resolved', resolution: 'Resolved by admin' }) })
            setSelected(prev => prev ? { ...prev, status: 'resolved' } : null)
            setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'resolved' } : t))
        } catch (err) { console.error(err) }
    }

    const reopenTicket = async () => {
        if (!selected) return
        try {
            await fetch('/api/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: selected.id, status: 'open' }) })
            setSelected(prev => prev ? { ...prev, status: 'open' } : null)
            setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'open' } : t))
        } catch (err) { console.error(err) }
    }

    const changePriority = async (priority: Ticket['priority']) => {
        if (!selected) return
        try {
            await fetch('/api/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: selected.id, priority }) })
            setSelected(prev => prev ? { ...prev, priority } : null)
            setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, priority } : t))
        } catch (err) { console.error(err) }
    }

    const filtered = tickets.filter(t => {
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || t.status === statusFilter
        return matchSearch && matchStatus
    })

    const counts = { open: tickets.filter(t => t.status === 'open').length, in_progress: tickets.filter(t => t.status === 'in_progress').length, resolved: tickets.filter(t => t.status === 'resolved').length }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading tickets...</span></div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><LifeBuoy className="h-5 w-5 text-red-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
                    <p className="text-muted-foreground">Manage guest tickets &amp; live chat</p>
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
                <div className="space-y-2 lg:col-span-1 overflow-y-auto max-h-[600px]">
                    {filtered.length === 0 ? (
                        <Card><CardContent className="p-8 text-center"><LifeBuoy className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No tickets found</p></CardContent></Card>
                    ) : filtered.map(t => (
                        <Card key={t.id} className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === t.id ? 'ring-2 ring-primary' : ''}`} onClick={() => selectTicket(t)}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground font-mono">{t.id.slice(0, 8)}</span>
                                    <Badge variant={priorityColors[t.priority] as any} className="text-[10px]">{t.priority}</Badge>
                                    <Badge variant={statusColors[t.status] as any} className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                                </div>
                                <p className="font-semibold text-sm">{t.subject}</p>
                                <p className="text-xs text-muted-foreground">{t.from}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2 flex flex-col">
                    {!selected ? (
                        <Card className="h-full flex items-center justify-center"><CardContent className="text-center p-8">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Select a ticket to start chatting</p>
                            <p className="text-xs text-muted-foreground mt-1">Messages update in real-time</p>
                        </CardContent></Card>
                    ) : (
                        <Card className="flex flex-col h-full">
                            <CardContent className="p-4 border-b flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{selected.subject}</h3>
                                        <p className="text-sm text-muted-foreground">{selected.from} ({selected.email}) • {selected.category}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="flex items-center gap-1 text-xs text-emerald-500">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                            Live
                                        </div>
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
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="font-medium text-xs mb-1">{m.role === 'admin' ? 'Admin' : m.sender_name || selected.from}</p>
                                            <p>{m.text}</p>
                                            <p className={`text-[10px] mt-1 ${m.role === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && <p className="text-center text-muted-foreground text-sm">No messages yet.</p>}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply */}
                            {selected.status !== 'resolved' && (
                                <div className="p-4 border-t flex-shrink-0">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type a reply..."
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAdminReply()}
                                        />
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
