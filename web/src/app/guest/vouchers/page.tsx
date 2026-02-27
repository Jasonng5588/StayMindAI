"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket, Copy, Check, Clock, Star, Gift } from 'lucide-react'

interface Voucher {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    description: string | null
    is_used: boolean
    used_at: string | null
    expires_at: string | null
    created_at: string
}

interface PromoCode {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    description: string | null
    valid_to: string | null
    used_count: number
    usage_limit: number | null
}

export default function GuestVouchersPage() {
    const [myVouchers, setMyVouchers] = useState<Voucher[]>([])
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)
    const [tab, setTab] = useState<'my' | 'available'>('my')

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [vRes, pRes] = await Promise.all([
                fetch('/api/vouchers'),
                fetch('/api/vouchers/public'),
            ])
            if (vRes.ok) { const d = await vRes.json(); setMyVouchers(d.vouchers || []) }
            if (pRes.ok) { const d = await pRes.json(); setPromoCodes(d.codes || []) }
        } catch { }
        setLoading(false)
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).catch(() => { })
        setCopied(code)
        setTimeout(() => setCopied(null), 2000)
    }

    const discountLabel = (type: string, value: number) =>
        type === 'percentage' ? `${value}% OFF` : `RM${value} OFF`

    const isExpired = (date?: string | null) => date ? new Date(date) < new Date() : false

    const available = myVouchers.filter(v => !v.is_used && !isExpired(v.expires_at))
    const used = myVouchers.filter(v => v.is_used)
    const expired = myVouchers.filter(v => !v.is_used && isExpired(v.expires_at))

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                    <Ticket className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">My Vouchers</h1>
                    <p className="text-sm text-muted-foreground">Your exclusive discount codes</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Available', value: available.length, color: 'text-emerald-500' },
                    { label: 'Used', value: used.length, color: 'text-muted-foreground' },
                    { label: 'Expired', value: expired.length, color: 'text-destructive' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-3 text-center">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'my' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                    onClick={() => setTab('my')}
                >🎟️ My Vouchers</button>
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'available' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                    onClick={() => setTab('available')}
                >🏷️ Public Codes</button>
            </div>

            {tab === 'my' && (
                <div className="space-y-3">
                    {myVouchers.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Gift className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="font-medium">No vouchers yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Personal vouchers from hotel staff will appear here</p>
                            </CardContent>
                        </Card>
                    ) : myVouchers.map(v => {
                        const expired = isExpired(v.expires_at)
                        const status = v.is_used ? 'used' : expired ? 'expired' : 'active'
                        return (
                            <Card key={v.id} className={`overflow-hidden border-2 ${status === 'active' ? 'border-emerald-500/30' : 'opacity-60 border-border'}`}>
                                <CardContent className="p-0">
                                    <div className="flex">
                                        {/* Left accent */}
                                        <div className={`w-2 flex-shrink-0 ${status === 'active' ? 'bg-emerald-500' : status === 'used' ? 'bg-muted-foreground' : 'bg-destructive'}`} />
                                        <div className="flex-1 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-bold text-lg tracking-wider">{v.code}</span>
                                                        <Badge variant={status === 'active' ? 'success' : status === 'used' ? 'secondary' : 'destructive'} className="text-[10px]">
                                                            {status === 'active' ? '✓ Active' : status === 'used' ? 'Used' : 'Expired'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{v.description || 'Personal voucher'}</p>
                                                    {v.expires_at && (
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {expired ? 'Expired' : 'Expires'}: {new Date(v.expires_at).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className={`text-xl font-bold ${status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                        {discountLabel(v.discount_type, v.discount_value)}
                                                    </div>
                                                    {status === 'active' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="mt-2 h-8 text-xs"
                                                            onClick={() => copyCode(v.code)}
                                                        >
                                                            {copied === v.code ? <><Check className="h-3 w-3 mr-1 text-emerald-500" />Copied!</> : <><Copy className="h-3 w-3 mr-1" />Copy Code</>}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {tab === 'available' && (
                <div className="space-y-3">
                    {promoCodes.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Star className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="font-medium">No public promo codes right now</p>
                                <p className="text-sm text-muted-foreground mt-1">Check back for special offers</p>
                            </CardContent>
                        </Card>
                    ) : promoCodes.map(p => {
                        const expired = isExpired(p.valid_to)
                        const limitReached = p.usage_limit ? p.used_count >= p.usage_limit : false
                        const active = !expired && !limitReached
                        return (
                            <Card key={p.id} className={`overflow-hidden border-2 ${active ? 'border-primary/30' : 'opacity-60 border-border'}`}>
                                <CardContent className="p-0">
                                    <div className="flex">
                                        <div className={`w-2 flex-shrink-0 ${active ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                        <div className="flex-1 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-bold text-lg tracking-wider">{p.code}</span>
                                                        {!active && <Badge variant="secondary" className="text-[10px]">{expired ? 'Expired' : 'Limit Reached'}</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{p.description || 'Promo code'}</p>
                                                    {p.valid_to && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />Until {new Date(p.valid_to).toLocaleDateString()}</p>}
                                                    {p.usage_limit && <p className="text-xs text-muted-foreground">Used: {p.used_count}/{p.usage_limit}</p>}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className={`text-xl font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                                                        {discountLabel(p.discount_type, p.discount_value)}
                                                    </div>
                                                    {active && (
                                                        <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => copyCode(p.code)}>
                                                            {copied === p.code ? <><Check className="h-3 w-3 mr-1 text-emerald-500" />Copied!</> : <><Copy className="h-3 w-3 mr-1" />Copy Code</>}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
