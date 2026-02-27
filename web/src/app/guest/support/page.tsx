"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LifeBuoy, Send, Plus, X, Clock, CheckCircle2, MessageCircle, Loader2, Star } from 'lucide-react'

interface Message { id: string; role: 'guest' | 'admin'; text: string; time: string }
interface Ticket {
    id: string; subject: string; description: string; category: string
    priority: string; status: string; created_at: string; messages: Message[]
}

const statusColors: Record<string, string> = { open: 'destructive', in_progress: 'warning', resolved: 'success', closed: 'secondary' }

export default function GuestSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Ticket | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [replyText, setReplyText] = useState('')
    const [sending, setSending] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [newForm, setNewForm] = useState({ subject: '', description: '', category: 'General', priority: 'medium' })
    const [creating, setCreating] = useState(false)
    // Review state (shown when ticket resolves)
    const [pendingReview, setPendingReview] = useState<Ticket | null>(null)
    const [reviewRating, setReviewRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef = useRef<any>(null)
    const supabase = useMemo(() => createClient(), [])

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    useEffect(() => { fetchTickets() }, [])
    useEffect(() => { scrollToBottom() }, [messages])

    // Subscribe to Realtime when a ticket is selected
    useEffect(() => {
        // Tear down existing channel first
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }
        if (!selected) return

        // Load existing messages immediately
        loadMessages(selected.id)

        const channelName = `ticket-messages-guest-${selected.id}`
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'ticket_messages',
                filter: `ticket_id=eq.${selected.id}`,
            }, (payload: { new: Record<string, unknown> }) => {
                const m = payload.new
                const msg: Message = { id: m.id as string, role: m.role as 'guest' | 'admin', text: m.message as string, time: new Date(m.created_at as string).toLocaleString() }
                setMessages(prev => prev.some(x => x.id === msg.id) ? prev : [...prev, msg])
                scrollToBottom()
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'support_tickets',
                filter: `id=eq.${selected.id}`,
            }, (payload: { new: Record<string, unknown> }) => {
                const newStatus = payload.new.status as string
                if (newStatus === 'resolved' && selected.status !== 'resolved') {
                    setSelected(prev => prev ? { ...prev, status: 'resolved' } : null)
                    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'resolved' } : t))
                    setTimeout(() => setPendingReview({ ...selected, status: 'resolved' }), 800)
                }
            })
            .subscribe((status, err) => {
                if (err) console.error('[Support RT] subscribe error:', err)
                else console.log('[Support RT] status:', status)
            })

        channelRef.current = channel
        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id])

    const loadMessages = async (ticketId: string) => {
        try {
            const res = await fetch(`/api/support/messages?ticket_id=${ticketId}`)
            if (res.ok) {
                const { messages: msgs } = await res.json()
                setMessages((msgs || []).map((m: Record<string, unknown>) => ({
                    id: m.id as string, role: m.role as 'guest' | 'admin',
                    text: m.message as string, time: new Date(m.created_at as string).toLocaleString(),
                })))
            }
        } catch { /* ignore */ }
        scrollToBottom()
    }

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/support')
            if (!res.ok) { setLoading(false); return }
            const { tickets: data } = await res.json()
            if (data) {
                const mapped: Ticket[] = (data as Record<string, unknown>[]).map((t) => ({
                    id: t.id as string, subject: t.subject as string, description: t.description as string,
                    category: (t.category as string) || 'General', priority: t.priority as string,
                    status: t.status as string, created_at: t.created_at as string, messages: [],
                }))
                setTickets(mapped)
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const selectTicket = (t: Ticket) => { setSelected(t); setMessages([]) }

    const createTicket = async () => {
        if (!newForm.subject.trim() || !newForm.description.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
            if (res.ok) { setShowNew(false); setNewForm({ subject: '', description: '', category: 'General', priority: 'medium' }); fetchTickets() }
        } catch (err) { console.error(err) }
        setCreating(false)
    }

    const sendReply = async () => {
        if (!replyText.trim() || !selected) return
        const text = replyText.trim()
        setReplyText('')
        // Optimistic update
        const optimistic: Message = { id: `opt-${Date.now()}`, role: 'guest', text, time: new Date().toLocaleString() }
        setMessages(prev => [...prev, optimistic])
        scrollToBottom()
        try {
            await fetch('/api/support/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: selected.id, message: text, role: 'guest' })
            })
        } catch (err) { console.error(err) }
        setSending(false)
    }

    const submitSupportReview = async () => {
        if (reviewRating < 1) return
        setSubmittingReview(true)
        try {
            await fetch('/api/support', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: pendingReview?.id, rating: reviewRating, review_text: reviewText })
            })
        } catch { /* non-critical */ }
        setPendingReview(null); setReviewRating(0); setReviewText('')
        setSubmittingReview(false)
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading tickets...</span></div>

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Review Modal */}
            {pendingReview && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-bold">Ticket Resolved!</h2>
                                <p className="text-muted-foreground text-sm mt-1">How was your support experience?</p>
                            </div>
                            <p className="text-sm font-medium text-center mb-2">Rate your experience</p>
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} onClick={() => setReviewRating(n)} className="transition-transform hover:scale-110">
                                        <Star className={`h-8 w-8 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea className="w-full p-3 rounded-lg border text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Tell us about your experience (optional)..." value={reviewText} onChange={e => setReviewText(e.target.value)} />
                            <div className="flex gap-3 mt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setPendingReview(null)}>Skip</Button>
                                <Button className="flex-1" disabled={reviewRating < 1 || submittingReview} onClick={submitSupportReview}>
                                    {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Submit Review
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10"><LifeBuoy className="h-5 w-5 text-red-600" /></div>
                    <div><h1 className="text-2xl font-bold tracking-tight">Support</h1><p className="text-muted-foreground">Get help from our team</p></div>
                </div>
                <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
            </div>

            {/* New Ticket Form */}
            {showNew && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Create Support Ticket</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowNew(false)}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="space-y-3">
                            <Input placeholder="Subject" value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })} />
                            <textarea className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe your issue..." value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} />
                            <div className="flex gap-3">
                                <select className="flex-1 h-9 rounded-md border bg-background px-3 text-sm" value={newForm.category} onChange={e => setNewForm({ ...newForm, category: e.target.value })}>
                                    <option value="General">General</option><option value="Billing">Billing</option><option value="Room">Room Issue</option><option value="Technical">Technical</option><option value="Complaint">Complaint</option>
                                </select>
                                <select className="flex-1 h-9 rounded-md border bg-background px-3 text-sm" value={newForm.priority} onChange={e => setNewForm({ ...newForm, priority: e.target.value })}>
                                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                                </select>
                            </div>
                            <Button onClick={createTicket} disabled={!newForm.subject.trim() || !newForm.description.trim() || creating} className="w-full">
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Submit Ticket
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
                {/* Ticket List */}
                <div className="space-y-2">
                    {tickets.length === 0 ? (
                        <Card><CardContent className="p-8 text-center">
                            <LifeBuoy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-semibold">No tickets yet</p>
                            <p className="text-sm text-muted-foreground">Create a ticket to get help</p>
                        </CardContent></Card>
                    ) : tickets.map(t => (
                        <Card key={t.id} className={`cursor-pointer hover:shadow-md transition-all ${selected?.id === t.id ? 'ring-2 ring-primary' : ''}`} onClick={() => selectTicket(t)}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={statusColors[t.status] as any} className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                                    <span className="text-xs text-muted-foreground">{t.category}</span>
                                </div>
                                <p className="font-semibold text-sm">{t.subject}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />{new Date(t.created_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chat Panel */}
                <div className="lg:col-span-2">
                    {!selected ? (
                        <Card className="h-full flex items-center justify-center"><CardContent className="text-center p-8">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Select a ticket to view conversation</p>
                            <p className="text-xs text-muted-foreground mt-1">Messages update in real-time</p>
                        </CardContent></Card>
                    ) : (
                        <Card className="flex flex-col h-full">
                            <CardContent className="p-4 border-b flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{selected.subject}</h3>
                                        <p className="text-sm text-muted-foreground">{selected.category} • {selected.priority} priority</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />Live
                                        </span>
                                        <Badge variant={statusColors[selected.status] as any}>{selected.status.replace('_', ' ')}</Badge>
                                    </div>
                                </div>
                            </CardContent>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
                                <div className="p-3 rounded-lg bg-muted text-sm">
                                    <p className="font-medium text-xs mb-1">You</p>
                                    <p>{selected.description}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(selected.created_at).toLocaleString()}</p>
                                </div>
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === 'guest' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'guest' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="font-medium text-xs mb-1">{m.role === 'guest' ? 'You' : 'Support Agent'}</p>
                                            <p>{m.text}</p>
                                            <p className={`text-[10px] mt-1 ${m.role === 'guest' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {selected.status !== 'resolved' && selected.status !== 'closed' && (
                                <div className="p-4 border-t flex-shrink-0">
                                    <div className="flex gap-2">
                                        <Input placeholder="Type a message..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()} />
                                        <Button onClick={sendReply} disabled={!replyText.trim() || sending}>
                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {(selected.status === 'resolved' || selected.status === 'closed') && (
                                <div className="p-4 border-t text-center text-sm text-muted-foreground flex-shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                                    This ticket has been {selected.status}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
