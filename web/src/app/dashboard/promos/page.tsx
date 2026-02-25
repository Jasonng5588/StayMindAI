"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Copy, Trash2, Edit2, Tag, ToggleLeft, ToggleRight, Save, X } from 'lucide-react'

interface Promo {
    id: string; code: string; discount: number; type: 'percentage' | 'fixed'
    minSpend: number; maxUses: number; used: number; validUntil: string; active: boolean
}

const initialPromos: Promo[] = [
    { id: '1', code: 'SPRING2026', discount: 20, type: 'percentage', minSpend: 100, maxUses: 200, used: 45, validUntil: '2026-03-31', active: true },
    { id: '2', code: 'WELCOME10', discount: 10, type: 'percentage', minSpend: 0, maxUses: 500, used: 312, validUntil: '2026-12-31', active: true },
    { id: '3', code: 'SUMMER50', discount: 50, type: 'fixed', minSpend: 200, maxUses: 100, used: 0, validUntil: '2026-06-30', active: false },
    { id: '4', code: 'VIP25', discount: 25, type: 'percentage', minSpend: 300, maxUses: 50, used: 12, validUntil: '2026-04-15', active: true },
]

export default function PromosPage() {
    const [promos, setPromos] = useState(initialPromos)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ code: '', discount: 10, type: 'percentage' as 'percentage' | 'fixed', minSpend: 0, maxUses: 100, validUntil: '' })

    const filtered = promos.filter(p => p.code.toLowerCase().includes(search.toLowerCase()))

    const handleSave = () => {
        if (!form.code || !form.validUntil) { alert('Please fill code and expiry date'); return }
        if (editingId) {
            setPromos(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p))
        } else {
            setPromos(prev => [{ id: `p-${Date.now()}`, ...form, used: 0, active: true }, ...prev])
        }
        setShowForm(false); setEditingId(null)
        setForm({ code: '', discount: 10, type: 'percentage', minSpend: 0, maxUses: 100, validUntil: '' })
    }

    const handleEdit = (p: Promo) => {
        setForm({ code: p.code, discount: p.discount, type: p.type, minSpend: p.minSpend, maxUses: p.maxUses, validUntil: p.validUntil })
        setEditingId(p.id); setShowForm(true)
    }

    const handleDelete = (id: string) => { if (confirm('Delete this promo code?')) setPromos(prev => prev.filter(p => p.id !== id)) }
    const toggleActive = (id: string) => { setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p)) }
    const copyCode = (code: string) => { navigator.clipboard.writeText(code); alert(`Copied: ${code}`) }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
                    <p className="text-muted-foreground">Manage promotional discounts</p>
                </div>
                <Button onClick={() => { setEditingId(null); setForm({ code: '', discount: 10, type: 'percentage', minSpend: 0, maxUses: 100, validUntil: '' }); setShowForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" /> Create Promo
                </Button>
            </div>

            {showForm && (
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit' : 'New'} Promo Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Code</label>
                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER50" />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Type</label>
                                <div className="flex gap-2">
                                    <Button variant={form.type === 'percentage' ? 'default' : 'outline'} size="sm" onClick={() => setForm({ ...form, type: 'percentage' })}>Percentage (%)</Button>
                                    <Button variant={form.type === 'fixed' ? 'default' : 'outline'} size="sm" onClick={() => setForm({ ...form, type: 'fixed' })}>Fixed ($)</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Discount {form.type === 'percentage' ? '(%)' : '($)'}</label>
                                <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Min Spend ($)</label>
                                <Input type="number" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Max Uses</label>
                                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Valid Until</label>
                                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> {editingId ? 'Update' : 'Create'}</Button>
                            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active', value: promos.filter(p => p.active).length },
                    { label: 'Total Uses', value: promos.reduce((s, p) => s + p.used, 0) },
                    { label: 'Avg Discount', value: `${Math.round(promos.filter(p => p.type === 'percentage').reduce((s, p) => s + p.discount, 0) / Math.max(promos.filter(p => p.type === 'percentage').length, 1))}%` },
                    { label: 'Expiring Soon', value: promos.filter(p => new Date(p.validUntil) < new Date(Date.now() + 30 * 86400000)).length },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search promo codes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Promos Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium">Code</th>
                                    <th className="text-left p-3 font-medium">Discount</th>
                                    <th className="text-left p-3 font-medium">Min Spend</th>
                                    <th className="text-left p-3 font-medium">Usage</th>
                                    <th className="text-left p-3 font-medium">Valid Until</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-right p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono font-semibold flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-primary" />
                                            {p.code}
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(p.code)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </td>
                                        <td className="p-3">{p.type === 'percentage' ? `${p.discount}%` : `$${p.discount}`}</td>
                                        <td className="p-3">${p.minSpend}</td>
                                        <td className="p-3">{p.used} / {p.maxUses}</td>
                                        <td className="p-3">{p.validUntil}</td>
                                        <td className="p-3">
                                            <Badge variant={p.active ? 'success' : 'secondary'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(p.id)}>
                                                    {p.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
