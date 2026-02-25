"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, DollarSign, CreditCard, Receipt, X, CheckCircle2, XCircle, Download, Eye, RotateCcw, Wallet, QrCode, Building, Loader2 } from 'lucide-react'

interface Payment {
    id: string; booking_id: string; guest_name: string; guest_email: string
    amount: number; method: string; status: string; date: string; room: string
    nights: number; check_in: string; check_out: string; receipt_sent: boolean
}

const methodIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    card: { icon: CreditCard, label: 'Credit Card', color: 'text-blue-600 bg-blue-500/10' },
    tng_ewallet: { icon: Wallet, label: 'TNG eWallet', color: 'text-blue-500 bg-blue-500/10' },
    duitnow_qr: { icon: QrCode, label: 'DuitNow QR', color: 'text-pink-600 bg-pink-500/10' },
    fpx: { icon: Building, label: 'FPX', color: 'text-emerald-600 bg-emerald-500/10' },
    stripe: { icon: CreditCard, label: 'Stripe', color: 'text-violet-600 bg-violet-500/10' },
    cash: { icon: DollarSign, label: 'Cash', color: 'text-amber-600 bg-amber-500/10' },
    bank_transfer: { icon: Building, label: 'Bank Transfer', color: 'text-emerald-600 bg-emerald-500/10' },
}

const statusColors: Record<string, string> = {
    completed: 'success', pending: 'warning', failed: 'destructive', refunded: 'secondary'
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [viewReceipt, setViewReceipt] = useState<Payment | null>(null)
    const [refundModal, setRefundModal] = useState<Payment | null>(null)
    const [refundReason, setRefundReason] = useState('')

    useEffect(() => { fetchPayments() }, [])

    const fetchPayments = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=payments')
            if (!res.ok) { setLoading(false); return }
            const { payments: data } = await res.json()

            if (data) {
                const mapped: Payment[] = data.map((p: Record<string, unknown>) => {
                    const booking = p.bookings as Record<string, unknown> | null
                    const room = (booking?.room_types as { name: string })?.name || 'Room'
                    const profile = booking?.profiles as { full_name: string; email: string } | null
                    const checkIn = booking?.check_in_date as string || ''
                    const checkOut = booking?.check_out_date as string || ''
                    const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 1

                    return {
                        id: p.id as string,
                        booking_id: (booking?.booking_number as string) || p.booking_id as string,
                        guest_name: profile?.full_name || 'Guest',
                        guest_email: profile?.email || '',
                        amount: Number(p.amount),
                        method: (p.method as string) || (p.payment_method as string) || 'card',
                        status: (p.status as string) || 'pending',
                        date: p.created_at as string,
                        room,
                        nights,
                        check_in: checkIn,
                        check_out: checkOut,
                        receipt_sent: !!(p.receipt_url),
                    }
                })
                setPayments(mapped)
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const filtered = payments.filter(p =>
        p.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        p.booking_id.toLowerCase().includes(search.toLowerCase())
    )

    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    const methodGroups = payments.reduce<Record<string, { count: number; total: number }>>((acc, p) => {
        if (!acc[p.method]) acc[p.method] = { count: 0, total: 0 }
        acc[p.method].count++
        acc[p.method].total += p.amount
        return acc
    }, {})

    const processRefund = async (id: string) => {
        try {
            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refund_payment', payment_id: id })
            })
            if (res.ok) {
                setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'refunded' } : p))
            }
            setRefundModal(null); setRefundReason('')
        } catch (err) { console.error(err) }
    }

    const downloadReceipt = (p: Payment) => {
        const receiptText = `
═══════════════════════════════════
        PAYMENT RECEIPT
═══════════════════════════════════

Receipt #:      ${p.id.slice(0, 8).toUpperCase()}
Booking #:      ${p.booking_id}
Date:           ${new Date(p.date).toLocaleString()}
Guest:          ${p.guest_name}
Email:          ${p.guest_email}

───────────────────────────────────
Room:           ${p.room}
Check-in:       ${p.check_in}
Check-out:      ${p.check_out}
Duration:       ${p.nights} night(s)
───────────────────────────────────

Total:          RM ${p.amount.toFixed(2)}
Payment Method: ${methodIcons[p.method]?.label || p.method}
Status:         ${p.status.toUpperCase()}

═══════════════════════════════════
        Thank you for your stay!
        StayMind AI Hotel System
═══════════════════════════════════
        `.trim()

        const blob = new Blob([receiptText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt_${p.id.slice(0, 8)}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading payments...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
                    <p className="text-muted-foreground">Track revenue and manage payment transactions</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">RM {totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent></Card>
                {Object.entries(methodGroups).slice(0, 3).map(([method, data]) => {
                    const m = methodIcons[method] || { icon: CreditCard, label: method, color: 'text-gray-500 bg-gray-500/10' }
                    const Icon = m.icon
                    return (
                        <Card key={method}><CardContent className="p-4 text-center">
                            <div className={`inline-flex p-1.5 rounded-lg ${m.color} mb-1`}><Icon className="h-4 w-4" /></div>
                            <p className="text-lg font-bold">RM {data.total.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{m.label} ({data.count})</p>
                        </CardContent></Card>
                    )
                })}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Payments Table */}
            {filtered.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No payments found</h3>
                    <p className="text-muted-foreground">Payments will appear here when guests complete bookings</p>
                </CardContent></Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">Payment ID</th>
                                        <th className="text-left p-3 font-medium">Guest</th>
                                        <th className="text-left p-3 font-medium">Room</th>
                                        <th className="text-left p-3 font-medium">Method</th>
                                        <th className="text-right p-3 font-medium">Amount</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                        <th className="text-left p-3 font-medium">Date</th>
                                        <th className="text-center p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(p => {
                                        const m = methodIcons[p.method] || { icon: CreditCard, label: p.method, color: 'text-gray-500' }
                                        const Icon = m.icon
                                        return (
                                            <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="p-3">
                                                    <p className="font-mono text-xs">{p.id.slice(0, 8).toUpperCase()}</p>
                                                    <p className="text-xs text-muted-foreground">{p.booking_id?.slice(0, 8)}</p>
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">{p.guest_name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.guest_email}</p>
                                                </td>
                                                <td className="p-3">{p.room}</td>
                                                <td className="p-3"><div className="flex items-center gap-1.5"><Icon className={`h-4 w-4 ${m.color.split(' ')[0]}`} /><span className="text-xs">{m.label}</span></div></td>
                                                <td className="p-3 text-right font-semibold">RM {p.amount.toFixed(2)}</td>
                                                <td className="p-3"><Badge variant={statusColors[p.status] as 'success' | 'warning' | 'destructive' | 'secondary' || 'secondary'}>{p.status}</Badge></td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <div className="flex justify-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewReceipt(p)} title="View Receipt"><Eye className="h-3.5 w-3.5" /></Button>
                                                        {p.status === 'completed' && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRefundModal(p)} title="Refund"><RotateCcw className="h-3.5 w-3.5" /></Button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Receipt Modal */}
            {viewReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewReceipt(null)}>
                    <Card className="w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2"><Receipt className="h-5 w-5" />Payment Receipt</h2>
                                <Button variant="ghost" size="icon" onClick={() => setViewReceipt(null)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="text-center mb-4 pb-4 border-b">
                                <h3 className="text-xl font-bold">StayMind AI Hotel</h3>
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between"><span className="text-muted-foreground">Receipt #</span><span className="font-mono">{viewReceipt.id.slice(0, 8).toUpperCase()}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Booking #</span><span className="font-mono">{viewReceipt.booking_id?.slice(0, 8)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(viewReceipt.date).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span>{viewReceipt.guest_name}</span></div>
                            </div>
                            <div className="border-t border-b py-3 mb-3 space-y-1 text-sm">
                                <div className="flex justify-between"><span>{viewReceipt.room}</span><span>RM {viewReceipt.amount.toFixed(2)}</span></div>
                                <div className="text-xs text-muted-foreground">{viewReceipt.check_in} → {viewReceipt.check_out} • {viewReceipt.nights} night(s)</div>
                            </div>
                            <div className="flex justify-between font-bold mb-4"><span>Total</span><span>RM {viewReceipt.amount.toFixed(2)}</span></div>
                            <div className="flex items-center gap-2 text-sm mb-6">
                                {(() => { const m = methodIcons[viewReceipt.method]; const Icon = m?.icon || CreditCard; return <><Icon className="h-4 w-4" /><span>{m?.label || viewReceipt.method}</span></> })()}
                                <Badge variant={statusColors[viewReceipt.status] as 'success' | 'warning' | 'destructive' | 'secondary'}>{viewReceipt.status}</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => { setViewReceipt(null) }}><CheckCircle2 className="h-4 w-4 mr-2" />Close</Button>
                                <Button className="flex-1" onClick={() => downloadReceipt(viewReceipt)}><Download className="h-4 w-4 mr-2" />Download</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Refund Modal */}
            {refundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRefundModal(null)}>
                    <Card className="w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold mb-4">Process Refund</h2>
                            <p className="text-sm text-muted-foreground mb-2">Refund <strong>RM {refundModal.amount.toFixed(2)}</strong> to <strong>{refundModal.guest_name}</strong>?</p>
                            <textarea className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-4" placeholder="Reason for refund..." value={refundReason} onChange={e => setRefundReason(e.target.value)} />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setRefundModal(null)}>Cancel</Button>
                                <Button variant="destructive" className="flex-1" onClick={() => processRefund(refundModal.id)} disabled={!refundReason.trim()}>
                                    <RotateCcw className="h-4 w-4 mr-2" />Process Refund
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
