"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Star, Gift, Trophy, Loader2, CheckCircle2 } from 'lucide-react'

interface Tier { id: string; name: string; min_points: number; benefits: string[]; color: string }
interface Reward { id: string; name: string; description: string; points_cost: number; category: string }

const tierStyles: Record<string, { bg: string; text: string; icon: string }> = {
    Bronze: { bg: 'from-amber-700/20 to-amber-500/10', text: 'text-amber-700', icon: '🥉' },
    Silver: { bg: 'from-gray-400/20 to-gray-300/10', text: 'text-gray-500', icon: '🥈' },
    Gold: { bg: 'from-yellow-500/20 to-yellow-400/10', text: 'text-yellow-600', icon: '🥇' },
    Platinum: { bg: 'from-violet-500/20 to-violet-400/10', text: 'text-violet-600', icon: '💎' },
}

export default function GuestLoyaltyPage() {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [rewards, setRewards] = useState<Reward[]>([])
    const [points, setPoints] = useState(0)
    const [currentTier, setCurrentTier] = useState('Bronze')
    const [loading, setLoading] = useState(true)
    const [redeeming, setRedeeming] = useState<string | null>(null)
    const [redeemed, setRedeemed] = useState<string | null>(null)

    useEffect(() => { fetchLoyaltyData() }, [])

    const fetchLoyaltyData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/loyalty')
            if (res.ok) {
                const data = await res.json()
                setTiers(data.tiers || [])
                setRewards(data.rewards || [])
                setPoints(data.total_points || 0)
                setCurrentTier(data.current_tier || 'Bronze')
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const redeemReward = async (rewardId: string, cost: number) => {
        if (points < cost) return
        setRedeeming(rewardId)
        try {
            const res = await fetch('/api/loyalty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'redeem', reward_id: rewardId })
            })
            if (res.ok) {
                setPoints(prev => prev - cost)
                setRedeemed(rewardId)
                setTimeout(() => setRedeemed(null), 3000)
            }
        } catch (err) { console.error(err) }
        setRedeeming(null)
    }

    const tierStyle = tierStyles[currentTier] || tierStyles.Bronze
    const currentTierObj = tiers.find(t => t.name === currentTier)
    const nextTier = (() => {
        const sorted = [...tiers].sort((a, b) => a.min_points - b.min_points)
        const idx = sorted.findIndex(t => t.name === currentTier)
        return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null
    })()
    const progress = nextTier ? Math.min((points / nextTier.min_points) * 100, 100) : 100

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading loyalty data...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><Crown className="h-5 w-5 text-amber-600" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1><p className="text-muted-foreground">Earn points and unlock rewards</p></div>
            </div>

            {/* Status Card */}
            <div className={`rounded-2xl bg-gradient-to-r ${tierStyle.bg} p-6 border`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Current Tier</p>
                        <h2 className={`text-3xl font-bold ${tierStyle.text}`}>{tierStyle.icon} {currentTier}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Points Balance</p>
                        <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                    </div>
                </div>
                {nextTier && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>{points.toLocaleString()} pts</span>
                            <span>{nextTier.min_points.toLocaleString()} pts for {nextTier.name}</span>
                        </div>
                        <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{(nextTier.min_points - points).toLocaleString()} more points to {nextTier.name}!</p>
                    </div>
                )}
            </div>

            {/* Tier Benefits */}
            {currentTierObj && currentTierObj.benefits && currentTierObj.benefits.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Your {currentTier} Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentTierObj.benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />{b}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All Tiers */}
            <div>
                <h3 className="font-semibold mb-3">All Tiers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tiers.sort((a, b) => a.min_points - b.min_points).map(t => {
                        const style = tierStyles[t.name] || tierStyles.Bronze
                        const isCurrentOrBelow = points >= t.min_points
                        return (
                            <Card key={t.id} className={`transition-all ${t.name === currentTier ? 'ring-2 ring-primary' : ''} ${!isCurrentOrBelow ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl mb-1">{style.icon}</p>
                                    <p className={`font-bold ${style.text}`}>{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.min_points.toLocaleString()} pts</p>
                                    {t.name === currentTier && <Badge className="mt-2">Current</Badge>}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Rewards */}
            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="h-5 w-5" />Available Rewards</h3>
                {rewards.length === 0 ? (
                    <Card><CardContent className="p-8 text-center">
                        <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No rewards available yet. Check back soon!</p>
                    </CardContent></Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map(r => {
                            const canAfford = points >= r.points_cost
                            return (
                                <Card key={r.id} className={`transition-all ${!canAfford ? 'opacity-60' : 'hover:shadow-md'}`}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold">{r.name}</h4>
                                            <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />{r.points_cost.toLocaleString()}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{r.description}</p>
                                        {redeemed === r.id ? (
                                            <div className="text-center text-emerald-600 text-sm font-medium"><CheckCircle2 className="h-5 w-5 mx-auto mb-1" />Redeemed!</div>
                                        ) : (
                                            <Button size="sm" className="w-full" disabled={!canAfford || redeeming === r.id} onClick={() => redeemReward(r.id, r.points_cost)}>
                                                {redeeming === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Gift className="h-4 w-4 mr-1" />}
                                                {canAfford ? 'Redeem' : `Need ${(r.points_cost - points).toLocaleString()} more pts`}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
