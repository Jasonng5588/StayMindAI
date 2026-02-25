"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Zap, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface AIModel {
    feature: string; calls: number; tokens: number; cost: string; pctOfTotal: number
}

export default function AdminAIMonitorPage() {
    const [models, setModels] = useState<AIModel[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalCalls: 0, avgLatency: '0ms', totalCost: '$0', activeModels: 0, errors: 0 })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/data?type=ai_logs')
                if (res.ok) {
                    const data = await res.json()
                    setModels(data.byFeature || [])
                    setStats({
                        totalCalls: data.totalCalls || 0,
                        avgLatency: data.avgLatency || '0ms',
                        totalCost: `$${data.totalCost || '0'}`,
                        activeModels: (data.byFeature || []).length,
                        errors: (data.errors || []).length,
                    })
                }
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading AI models...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Monitor</h1>
                <p className="text-muted-foreground">Monitor AI model performance and usage</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: stats.totalCalls.toLocaleString(), icon: Zap, color: 'text-blue-600 bg-blue-500/10' },
                    { label: 'Avg Latency', value: stats.avgLatency, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Models Active', value: `${stats.activeModels}`, icon: Brain, color: 'text-violet-600 bg-violet-500/10' },
                    { label: 'Errors', value: stats.errors.toString(), icon: AlertTriangle, color: 'text-amber-600 bg-amber-500/10' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>AI Models</CardTitle><CardDescription>Usage breakdown by AI feature</CardDescription></CardHeader>
                <CardContent>
                    {models.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No AI model usage data recorded yet. AI features will appear here as they are used.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">Model</th>
                                        <th className="text-left p-3 font-medium">Requests</th>
                                        <th className="text-left p-3 font-medium">Tokens</th>
                                        <th className="text-left p-3 font-medium">Cost</th>
                                        <th className="text-left p-3 font-medium">Share</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models.map(m => (
                                        <tr key={m.feature} className="border-b hover:bg-muted/30">
                                            <td className="p-3 font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />{m.feature}</td>
                                            <td className="p-3">{m.calls.toLocaleString()}</td>
                                            <td className="p-3">{m.tokens > 1000 ? `${(m.tokens / 1000).toFixed(0)}K` : m.tokens}</td>
                                            <td className="p-3">{m.cost}</td>
                                            <td className="p-3">{m.pctOfTotal}%</td>
                                            <td className="p-3">
                                                <Badge variant="success" className="flex items-center gap-1 w-fit">
                                                    <CheckCircle2 className="h-3 w-3" />active
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
