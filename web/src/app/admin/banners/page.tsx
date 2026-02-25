"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Image, Plus, X, Save, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, CheckCircle2, Calendar, Link, Loader2 } from 'lucide-react'

interface Banner {
    id: string; title: string; subtitle: string; image_url: string
    link_url: string; is_active: boolean; start_date: string; end_date: string; position: number
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<Banner | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', start_date: '', end_date: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchBanners() }, [])

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/banners')
            if (res.ok) {
                const data = await res.json()
                setBanners(data.banners || [])
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const toggleActive = async (id: string) => {
        const banner = banners.find(b => b.id === id)
        if (!banner) return
        try {
            const res = await fetch('/api/banners', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !banner.is_active })
            })
            if (res.ok) setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b))
        } catch (err) { console.error(err) }
    }

    const deleteBanner = async (id: string) => {
        if (!confirm('Delete this banner?')) return
        try {
            const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
            if (res.ok) setBanners(prev => prev.filter(b => b.id !== id))
        } catch (err) { console.error(err) }
    }

    const moveUp = (id: string) => {
        const idx = banners.findIndex(b => b.id === id)
        if (idx <= 0) return
        const newBanners = [...banners]
            ;[newBanners[idx - 1], newBanners[idx]] = [newBanners[idx], newBanners[idx - 1]]
        newBanners.forEach((b, i) => b.position = i + 1)
        setBanners(newBanners)
        // Save positions
        newBanners.forEach(b => fetch('/api/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, position: b.position }) }))
    }

    const moveDown = (id: string) => {
        const idx = banners.findIndex(b => b.id === id)
        if (idx < 0 || idx >= banners.length - 1) return
        const newBanners = [...banners]
            ;[newBanners[idx], newBanners[idx + 1]] = [newBanners[idx + 1], newBanners[idx]]
        newBanners.forEach((b, i) => b.position = i + 1)
        setBanners(newBanners)
        newBanners.forEach(b => fetch('/api/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, position: b.position }) }))
    }

    const saveBanner = async () => {
        if (!form.title.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const res = await fetch('/api/banners', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editing.id, title: form.title, subtitle: form.subtitle, image_url: form.image_url, link_url: form.link_url, start_date: form.start_date || null, end_date: form.end_date || null })
                })
                if (res.ok) {
                    setBanners(prev => prev.map(b => b.id === editing.id ? { ...b, ...form } : b))
                }
            } else {
                // hotel_id resolved on the server side
                const hotel_id = null

                const res = await fetch('/api/banners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hotel_id, ...form, position: banners.length + 1 })
                })
                if (res.ok) { fetchBanners() }
            }
        } catch (err) { console.error(err) }
        setSaving(false)
        setShowForm(false)
        setEditing(null)
        setForm({ title: '', subtitle: '', image_url: '', link_url: '', start_date: '', end_date: '' })
    }

    const startEdit = (b: Banner) => {
        setEditing(b)
        setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '', link_url: b.link_url || '', start_date: b.start_date || '', end_date: b.end_date || '' })
        setShowForm(true)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading banners...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10"><Image className="h-5 w-5 text-pink-600" /></div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Banner Management</h1>
                        <p className="text-muted-foreground">Manage promotional banners for the guest homepage</p>
                    </div>
                </div>
                <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', start_date: '', end_date: '' }) }}>
                    <Plus className="h-4 w-4 mr-2" />Add Banner
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">{editing ? 'Edit Banner' : 'New Banner'}</h2>
                            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditing(null) }}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Title</label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Banner title" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Subtitle</label>
                                <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Banner subtitle" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Image URL</label>
                                <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Link URL</label>
                                <Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="/guest/rooms" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Start Date</label>
                                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">End Date</label>
                                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                            </div>
                        </div>
                        <Button className="mt-4" onClick={saveBanner} disabled={!form.title.trim() || saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{editing ? 'Update' : 'Create'} Banner
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Banner List */}
            {banners.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No banners yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first promotional banner</p>
                    <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
                </CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {banners.sort((a, b) => a.position - b.position).map((b, idx) => (
                        <Card key={b.id} className={`transition-all ${!b.is_active ? 'opacity-50' : ''}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(b.id)} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(b.id)} disabled={idx === banners.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                </div>
                                <div className="w-40 h-20 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center text-sm text-primary/60 overflow-hidden">
                                    {b.image_url ? <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" /> : 'No image'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{b.title}</p>
                                        <Badge variant={b.is_active ? 'success' : 'secondary'}>{b.is_active ? 'Active' : 'Hidden'}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{b.subtitle}</p>
                                    {(b.start_date || b.end_date) && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />{b.start_date || '...'} → {b.end_date || '...'}
                                        </div>
                                    )}
                                    {b.link_url && <div className="flex items-center gap-1 mt-0.5 text-xs text-blue-500"><Link className="h-3 w-3" />{b.link_url}</div>}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => toggleActive(b.id)} title={b.is_active ? 'Hide' : 'Show'}>
                                        {b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(b)} title="Edit"><Save className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteBanner(b.id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
