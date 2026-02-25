"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Crown, Plus, Save, X, Trash2, Gift, Star, Edit, Loader2 } from 'lucide-react'

interface Tier { id: string; name: string; min_points: number; benefits: string[]; multiplier: number }
interface Reward { id: string; name: string; description: string; points_cost: number; category: string; is_active: boolean }

export default function AdminLoyaltyPage() {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [editTier, setEditTier] = useState<Tier | null>(null)
    const [editReward, setEditReward] = useState<Reward | null>(null)
    const [showTierForm, setShowTierForm] = useState(false)
    const [showRewardForm, setShowRewardForm] = useState(false)
    const [tierForm, setTierForm] = useState({ name: '', min_points: 0, benefits: '', multiplier: 1 })
    const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_cost: 0, category: 'General' })
    const [saving, setSaving] = useState(false)
    const [hotelId, setHotelId] = useState<string | null>(null)

    useEffect(() => {
        // First fetch a hotel_id, then fetch loyalty data
        const init = async () => {
            try {
                const hRes = await fetch('/api/admin/data?type=hotels')
                if (hRes.ok) {
                    const hData = await hRes.json()
                    const id = hData.hotels?.[0]?.id
                    if (id) {
                        setHotelId(id)
                        fetchData(id)
                        return
                    }
                }
                // Fallback: try dashboard
                const dRes = await fetch('/api/admin/data?type=dashboard')
                if (dRes.ok) {
                    const dData = await dRes.json()
                    const id = dData.recentBookings?.[0]?.hotel_id
                    if (id) {
                        setHotelId(id)
                        fetchData(id)
                        return
                    }
                }
            } catch { /* ignore */ }
            setLoading(false)
        }
        init()
    }, [])

    const fetchData = async (hid?: string) => {
        const id = hid || hotelId
        if (!id) { setLoading(false); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/loyalty/admin?hotel_id=${id}`)
            if (res.ok) {
                const data = await res.json()
                setTiers(data.tiers || [])
                setRewards(data.rewards || [])
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const saveTier = async () => {
        setSaving(true)
        try {
            const body = {
                action: editTier ? 'update_tier' : 'create_tier',
                hotel_id: hotelId,
                ...(editTier ? { tier_id: editTier.id } : {}),
                name: tierForm.name,
                min_points: tierForm.min_points,
                benefits: tierForm.benefits.split('\n').filter(b => b.trim()),
                multiplier: tierForm.multiplier,
            }
            const res = await fetch('/api/loyalty/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (res.ok) {
                fetchData()
                setShowTierForm(false)
                setEditTier(null)
            }
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    const deleteTier = async (id: string) => {
        if (!confirm('Delete this tier?')) return
        try {
            const res = await fetch('/api/loyalty/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_tier', tier_id: id }) })
            if (res.ok) setTiers(prev => prev.filter(t => t.id !== id))
        } catch (err) { console.error(err) }
    }

    const saveReward = async () => {
        setSaving(true)
        try {
            const body = {
                action: editReward ? 'update_reward' : 'create_reward',
                hotel_id: hotelId,
                ...(editReward ? { reward_id: editReward.id } : {}),
                ...rewardForm,
            }
            const res = await fetch('/api/loyalty/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (res.ok) {
                fetchData()
                setShowRewardForm(false)
                setEditReward(null)
            }
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    const deleteReward = async (id: string) => {
        if (!confirm('Delete this reward?')) return
        try {
            const res = await fetch('/api/loyalty/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_reward', reward_id: id }) })
            if (res.ok) setRewards(prev => prev.filter(r => r.id !== id))
        } catch (err) { console.error(err) }
    }

    const startEditTier = (t: Tier) => {
        setEditTier(t)
        setTierForm({ name: t.name, min_points: t.min_points, benefits: t.benefits.join('\n'), multiplier: t.multiplier })
        setShowTierForm(true)
    }

    const startEditReward = (r: Reward) => {
        setEditReward(r)
        setRewardForm({ name: r.name, description: r.description, points_cost: r.points_cost, category: r.category })
        setShowRewardForm(true)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading loyalty data...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><Crown className="h-5 w-5 text-amber-600" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight">Loyalty Management</h1><p className="text-muted-foreground">Configure tiers, rewards, and points</p></div>
            </div>

            {/* Tiers Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Star className="h-5 w-5" />Loyalty Tiers ({tiers.length})</h2>
                    <Button size="sm" onClick={() => { setShowTierForm(true); setEditTier(null); setTierForm({ name: '', min_points: 0, benefits: '', multiplier: 1 }) }}><Plus className="h-4 w-4 mr-1" />Add Tier</Button>
                </div>

                {showTierForm && (
                    <Card className="mb-4"><CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{editTier ? 'Edit Tier' : 'New Tier'}</h3>
                            <Button variant="ghost" size="icon" onClick={() => { setShowTierForm(false); setEditTier(null) }}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <Input placeholder="Tier name" value={tierForm.name} onChange={e => setTierForm({ ...tierForm, name: e.target.value })} />
                            <Input type="number" placeholder="Min points" value={tierForm.min_points} onChange={e => setTierForm({ ...tierForm, min_points: Number(e.target.value) })} />
                            <Input type="number" step="0.1" placeholder="Points multiplier" value={tierForm.multiplier} onChange={e => setTierForm({ ...tierForm, multiplier: Number(e.target.value) })} />
                        </div>
                        <textarea className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-3" placeholder="Benefits (one per line)" value={tierForm.benefits} onChange={e => setTierForm({ ...tierForm, benefits: e.target.value })} />
                        <Button onClick={saveTier} disabled={!tierForm.name.trim() || saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{editTier ? 'Update' : 'Create'} Tier
                        </Button>
                    </CardContent></Card>
                )}

                {tiers.length === 0 ? (
                    <Card><CardContent className="p-8 text-center"><Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No tiers configured. Add your first tier!</p></CardContent></Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tiers.sort((a, b) => a.min_points - b.min_points).map(t => (
                            <Card key={t.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold">{t.name}</h3>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditTier(t)}><Edit className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTier(t.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{t.min_points.toLocaleString()} pts • {t.multiplier}x multiplier</p>
                                    {t.benefits && t.benefits.length > 0 && (
                                        <div className="mt-2 space-y-0.5">
                                            {t.benefits.slice(0, 3).map((b, i) => (
                                                <p key={i} className="text-xs text-muted-foreground">• {b}</p>
                                            ))}
                                            {t.benefits.length > 3 && <p className="text-xs text-muted-foreground">+{t.benefits.length - 3} more</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Rewards Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Gift className="h-5 w-5" />Rewards ({rewards.length})</h2>
                    <Button size="sm" onClick={() => { setShowRewardForm(true); setEditReward(null); setRewardForm({ name: '', description: '', points_cost: 0, category: 'General' }) }}><Plus className="h-4 w-4 mr-1" />Add Reward</Button>
                </div>

                {showRewardForm && (
                    <Card className="mb-4"><CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{editReward ? 'Edit Reward' : 'New Reward'}</h3>
                            <Button variant="ghost" size="icon" onClick={() => { setShowRewardForm(false); setEditReward(null) }}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <Input placeholder="Reward name" value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} />
                            <Input type="number" placeholder="Points cost" value={rewardForm.points_cost} onChange={e => setRewardForm({ ...rewardForm, points_cost: Number(e.target.value) })} />
                        </div>
                        <textarea className="w-full min-h-[60px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-3" placeholder="Description" value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} />
                        <div className="flex items-center gap-3">
                            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={rewardForm.category} onChange={e => setRewardForm({ ...rewardForm, category: e.target.value })}>
                                <option>General</option><option>Room Upgrade</option><option>Dining</option><option>Spa</option><option>Experience</option>
                            </select>
                            <Button onClick={saveReward} disabled={!rewardForm.name.trim() || saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{editReward ? 'Update' : 'Create'} Reward
                            </Button>
                        </div>
                    </CardContent></Card>
                )}

                {rewards.length === 0 ? (
                    <Card><CardContent className="p-8 text-center"><Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No rewards configured. Add your first reward!</p></CardContent></Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map(r => (
                            <Card key={r.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold">{r.name}</h4>
                                            <Badge variant="secondary" className="mt-1">{r.category}</Badge>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditReward(r)}><Edit className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReward(r.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{r.description}</p>
                                    <p className="mt-2 font-bold text-primary">{r.points_cost.toLocaleString()} points</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
