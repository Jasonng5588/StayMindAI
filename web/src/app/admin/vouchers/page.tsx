"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Ticket, Plus, Pencil, Trash2, Loader2, X, CheckCircle2, ToggleLeft, ToggleRight, Search, Send, Users, Gift } from 'lucide-react'

interface PromoCode {
    id: string; code: string; discount_type: string; discount_value: number
    usage_limit: number | null; used_count: number; valid_from: string | null; valid_to: string | null
    is_active: boolean; created_at: string; description: string | null
}
interface Guest { id: string; email: string; full_name: string }

export default function AdminVouchersPage() {
    const [codes, setCodes] = useState<PromoCode[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showSend, setShowSend] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', start_date: '', end_date: '', description: '' })

    // Send to guest state
    const [guests, setGuests] = useState<Guest[]>([])
    const [guestSearch, setGuestSearch] = useState('')
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
    const [sendForm, setSendForm] = useState({ user_id: '', code: '', discount_type: 'percentage', discount_value: '10', description: '', expires_at: '' })
    const [sending, setSending] = useState(false)
    const [sendSuccess, setSendSuccess] = useState('')

    const fetchCodes = async () => {
        try {
            const res = await fetch('/api/admin/data?type=promo_codes')
            if (res.ok) { const d = await res.json(); setCodes(d.codes || []) }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const fetchGuests = async () => {
        try {
            const res = await fetch('/api/admin/data?type=customers')
            if (res.ok) {
                const d = await res.json()
                const raw = d.profiles || d.users || []
                setGuests(raw.map((p: Record<string, unknown>) => ({ id: p.id, email: p.email, full_name: p.full_name })))
            }
        } catch (err) { console.error(err) }
    }

    useEffect(() => { fetchCodes() }, [])
    useEffect(() => { if (showSend) fetchGuests() }, [showSend])

    const resetForm = () => {
        setForm({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', start_date: '', end_date: '', description: '' })
        setShowForm(false); setEditingId(null)
    }

    const handleSave = async () => {
        if (!form.code || !form.discount_value) return
        try {
            if (editingId) {
                await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_promo', promo_id: editingId, code: form.code, discount_type: form.discount_type, discount_value: Number(form.discount_value), max_uses: form.max_uses ? Number(form.max_uses) : null, valid_from: form.start_date || null, valid_until: form.end_date || null, description: form.description || null }) })
            } else {
                await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_promo', ...form }) })
            }
            resetForm(); fetchCodes()
        } catch (err) { console.error(err) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this promo code?')) return
        await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_promo', promo_id: id }) })
        fetchCodes()
    }

    const toggleActive = async (c: PromoCode) => {
        await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_promo', promo_id: c.id, is_active: !c.is_active }) })
        fetchCodes()
    }

    const startEdit = (c: PromoCode) => {
        setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value.toString(), max_uses: c.usage_limit?.toString() || '', start_date: c.valid_from?.split('T')[0] || '', end_date: c.valid_to?.split('T')[0] || '', description: c.description || '' })
        setEditingId(c.id); setShowForm(true)
    }

    const selectGuest = (g: Guest) => {
        setSelectedGuest(g)
        setSendForm(f => ({ ...f, user_id: g.id }))
        setGuestSearch(g.full_name || g.email)
    }

    const sendVoucher = async () => {
        if (!sendForm.user_id || !sendForm.code || !sendForm.discount_value) return
        setSending(true)
        try {
            const res = await fetch('/api/admin/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: sendForm.user_id,
                    code: sendForm.code.toUpperCase(),
                    discount_type: sendForm.discount_type,
                    discount_value: Number(sendForm.discount_value),
                    description: sendForm.description || null,
                    expires_at: sendForm.expires_at || null,
                }),
            })
            if (res.ok) {
                setSendSuccess(`✅ Voucher "${sendForm.code.toUpperCase()}" sent to ${selectedGuest?.full_name || 'guest'}! They will receive a notification.`)
                setSendForm({ user_id: '', code: '', discount_type: 'percentage', discount_value: '10', description: '', expires_at: '' })
                setSelectedGuest(null); setGuestSearch('')
                fetchCodes()
                setTimeout(() => setSendSuccess(''), 5000)
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'Failed'))
            }
        } catch (err) { console.error(err) }
        setSending(false)
    }

    const filteredGuests = guests.filter(g =>
        guestSearch.length > 0 && !selectedGuest &&
        (g.full_name?.toLowerCase().includes(guestSearch.toLowerCase()) || g.email?.toLowerCase().includes(guestSearch.toLowerCase()))
    )

    const filtered = codes.filter(c => c.code.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-600"><Ticket className="h-5 w-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Voucher Management</h1>
                        <p className="text-muted-foreground">Create promo codes & send personal vouchers to guests</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowSend(!showSend); setShowForm(false) }}>
                        <Gift className="h-4 w-4 mr-2" />Send to Guest
                    </Button>
                    <Button onClick={() => { resetForm(); setShowForm(true); setShowSend(false) }}>
                        <Plus className="h-4 w-4 mr-2" />Create Voucher
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Vouchers', value: codes.length },
                    { label: 'Active', value: codes.filter(c => c.is_active).length },
                    { label: 'Expired', value: codes.filter(c => c.valid_to && new Date(c.valid_to) < new Date()).length },
                    { label: 'Total Uses', value: codes.reduce((s, c) => s + (c.used_count || 0), 0) },
                ].map(s => (
                    <Card key={s.label}><CardContent className="p-4"><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
                ))}
            </div>

            {/* Send Success Banner */}
            {sendSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />{sendSuccess}
                </div>
            )}

            {/* ── Send Personal Voucher Panel ── */}
            {showSend && (
                <Card className="border-emerald-500/30">
                    <CardHeader><CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Gift className="h-5 w-5 text-emerald-500" />Send Personal Voucher to Guest</span>
                        <Button variant="ghost" size="sm" onClick={() => { setShowSend(false); setSelectedGuest(null); setGuestSearch('') }}><X className="h-4 w-4" /></Button>
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">This creates a personal voucher for a specific guest. They will receive a push notification automatically.</p>

                        {/* Guest picker */}
                        <div>
                            <label className="text-sm font-medium block mb-1">Send to Guest *</label>
                            <div className="relative">
                                <Input
                                    placeholder="Search guest by name or email..."
                                    value={guestSearch}
                                    onChange={e => { setGuestSearch(e.target.value); if (!e.target.value) { setSelectedGuest(null); setSendForm(f => ({ ...f, user_id: '' })) } }}
                                />
                                {filteredGuests.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredGuests.slice(0, 8).map(g => (
                                            <button key={g.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2" onClick={() => selectGuest(g)}>
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">{g.full_name}</span>
                                                <span className="text-muted-foreground text-xs">{g.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedGuest && <p className="text-xs text-emerald-600 mt-1">✓ Sending to: {selectedGuest.full_name} ({selectedGuest.email})</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Voucher Code *</label>
                                <Input placeholder="JASON20" value={sendForm.code} onChange={e => setSendForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Type</label>
                                <select className="w-full h-10 rounded-md border px-3 text-sm" value={sendForm.discount_type} onChange={e => setSendForm(f => ({ ...f, discount_type: e.target.value }))}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (RM)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Discount Value *</label>
                                <Input type="number" placeholder="10" value={sendForm.discount_value} onChange={e => setSendForm(f => ({ ...f, discount_value: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Description (shown to guest)</label>
                                <Input placeholder="Special offer for your next stay!" value={sendForm.description} onChange={e => setSendForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Expires At (optional)</label>
                                <Input type="date" value={sendForm.expires_at} onChange={e => setSendForm(f => ({ ...f, expires_at: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={sendVoucher} disabled={!sendForm.user_id || !sendForm.code || !sendForm.discount_value || sending} className="bg-emerald-600 hover:bg-emerald-700">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                Send Voucher + Notify Guest
                            </Button>
                            <Button variant="outline" onClick={() => { setShowSend(false); setSelectedGuest(null); setGuestSearch('') }}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{editingId ? 'Edit Voucher' : 'Create New Promo Voucher'}</span>
                            <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium block mb-1">Code *</label><Input placeholder="SUMMER2025" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} /></div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Type</label>
                                <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (RM)</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium block mb-1">Value *</label><Input type="number" placeholder={form.discount_type === 'percentage' ? '10' : '50'} value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium block mb-1">Max Uses</label><Input type="number" placeholder="Unlimited" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium block mb-1">Start Date</label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium block mb-1">End Date</label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                        </div>
                        <div><label className="text-sm font-medium block mb-1">Description</label><Input placeholder="Enter description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave}><CheckCircle2 className="h-4 w-4 mr-2" />{editingId ? 'Update' : 'Create'}</Button>
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search vouchers..." value={search} onChange={e => setSearch(e.target.value)} /></div>

            {/* List */}
            <Card>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">{codes.length === 0 ? 'No vouchers created yet' : 'No matching vouchers'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium">Code</th>
                                    <th className="text-left p-3 font-medium">Discount</th>
                                    <th className="text-left p-3 font-medium">Uses</th>
                                    <th className="text-left p-3 font-medium">Valid Period</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-right p-3 font-medium">Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(c => {
                                        const expired = c.valid_to && new Date(c.valid_to) < new Date()
                                        return (
                                            <tr key={c.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">
                                                    <span className="font-mono font-bold">{c.code}</span>
                                                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                                                </td>
                                                <td className="p-3">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `RM ${c.discount_value}`}</td>
                                                <td className="p-3">{c.used_count || 0}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                                                <td className="p-3 text-xs">{c.valid_from ? new Date(c.valid_from).toLocaleDateString() : '—'} → {c.valid_to ? new Date(c.valid_to).toLocaleDateString() : '∞'}</td>
                                                <td className="p-3"><Badge variant={expired ? 'destructive' : c.is_active ? 'success' : 'secondary'}>{expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                                <td className="p-3">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedGuest(null); setGuestSearch(''); setSendForm(f => ({ ...f, code: c.code, discount_type: c.discount_type, discount_value: c.discount_value.toString() })); setShowSend(true); setShowForm(false) }} title="Send to guest"><Send className="h-4 w-4 text-emerald-600" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => toggleActive(c)} title={c.is_active ? 'Deactivate' : 'Activate'}>{c.is_active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
