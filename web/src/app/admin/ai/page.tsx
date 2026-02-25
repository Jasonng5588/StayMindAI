"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Activity, Zap, DollarSign, Clock, AlertTriangle, Loader2 } from 'lucide-react'

interface AIData {
    totalCalls: number; totalTokens: number; totalCost: string; avgLatency: string
    byFeature: { feature: string; calls: number; tokens: number; cost: string; pctOfTotal: number }[]
    errors: Record<string, unknown>[]
}

export default function AIMonitorPage() {
    const [data, setData] = useState<AIData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/data?type=ai_logs')
                if (res.ok) setData(await res.json())
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading AI usage data...</span></div>
    }

    const metrics = [
        { label: 'API Calls', value: data?.totalCalls?.toLocaleString() || '0', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-500/10' },
        { label: 'Tokens Used', value: data?.totalTokens ? `${(data.totalTokens / 1000).toFixed(0)}K` : '0', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-500/10' },
        { label: 'Estimated Cost', value: data?.totalCost ? `$${data.totalCost}` : '$0', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        { label: 'Avg Latency', value: data?.avgLatency || '0ms', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    ]

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-600"><Brain className="h-5 w-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Usage Monitor</h1>
                        <p className="text-muted-foreground">Gemini API usage, costs, and performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map(m => (
                        <Card key={m.label}><CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${m.bg}`}><m.icon className={`h-5 w-5 ${m.color}`} /></div>
                            <div><p className="text-2xl font-bold">{m.value}</p><p className="text-sm text-muted-foreground">{m.label}</p></div>
                        </CardContent></Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Usage by Feature</CardTitle></CardHeader>
                        <CardContent>
                            {(!data?.byFeature || data.byFeature.length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No AI usage data yet. AI features will be tracked here automatically.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.byFeature.map(f => (
                                        <div key={f.feature}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">{f.feature}</span>
                                                <span className="text-muted-foreground">{f.calls} calls • {f.cost}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${f.pctOfTotal}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Recent Errors</CardTitle></CardHeader>
                        <CardContent>
                            {(!data?.errors || data.errors.length === 0) ? (
                                <p className="text-sm text-center py-4 text-emerald-600">✅ No errors detected</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.errors.map((e, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                            <span className="text-xs text-muted-foreground font-mono">{(e.created_at as string)?.split('T')[1]?.slice(0, 5) || '--:--'}</span>
                                            <Badge variant="outline">{(e.feature as string) || 'Unknown'}</Badge>
                                            <span className="text-sm flex-1 truncate">{(e.error as string) || 'Error'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
