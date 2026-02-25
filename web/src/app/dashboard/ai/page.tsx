"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, TrendingDown, Sparkles, MessageSquare, BarChart3, Lightbulb, ArrowRight, Zap } from 'lucide-react'

const insights = [
    { title: 'Dynamic Pricing Opportunity', description: 'Weekend occupancy is trending 15% higher than average. Consider raising Ocean View Deluxe rates by $30 for the next 2 weekends.', impact: '+$2,400', type: 'pricing', icon: TrendingUp },
    { title: 'Occupancy Forecast', description: 'Next 30 days predict 82% average occupancy. Peak expected March 1-5 (95%). Consider staffing adjustments.', impact: '82% avg', type: 'forecast', icon: BarChart3 },
    { title: 'Review Sentiment Alert', description: '3 recent reviews mention "slow check-in". Average check-in time: 12 min. Industry benchmark: 5 min.', impact: '-0.3 rating', type: 'sentiment', icon: MessageSquare },
    { title: 'Marketing Suggestion', description: 'Spring break is 3 weeks away. Generate targeted promotional content for family packages.', impact: '+$5,000', type: 'marketing', icon: Lightbulb },
]

const pricingSuggestions = [
    { roomType: 'Ocean View Deluxe', currentPrice: 299, suggestedPrice: 329, reason: 'High weekend demand', change: '+10%' },
    { roomType: 'Garden Suite', currentPrice: 449, suggestedPrice: 419, reason: 'Below avg occupancy', change: '-7%' },
    { roomType: 'Standard Room', currentPrice: 179, suggestedPrice: 199, reason: 'Near capacity', change: '+11%' },
]

const sentimentData = [
    { category: 'Cleanliness', score: 4.8, trend: 'up' },
    { category: 'Service', score: 4.5, trend: 'up' },
    { category: 'Location', score: 4.9, trend: 'stable' },
    { category: 'Value', score: 4.2, trend: 'down' },
    { category: 'Amenities', score: 4.6, trend: 'up' },
]

export default function AIInsightsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Brain className="h-7 w-7 text-primary" />
                        AI Insights
                    </h1>
                    <p className="text-muted-foreground">AI-powered recommendations and analysis</p>
                </div>
                <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Report
                </Button>
            </div>

            {/* AI Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all hover:border-primary/30">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <insight.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold">{insight.title}</h3>
                                        <Badge variant={insight.type === 'sentiment' ? 'destructive' : 'success'}>
                                            {insight.impact}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{insight.description}</p>
                                    <Button variant="ghost" size="sm" className="mt-3 -ml-3 text-primary">
                                        Take Action <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dynamic Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            Dynamic Pricing Suggestions
                        </CardTitle>
                        <CardDescription>AI-recommended price adjustments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pricingSuggestions.map((s, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{s.roomType}</p>
                                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground line-through">${s.currentPrice}</p>
                                        <p className="font-bold">${s.suggestedPrice}</p>
                                    </div>
                                    <Badge variant={s.change.startsWith('+') ? 'success' : 'destructive'}>
                                        {s.change}
                                    </Badge>
                                    <Button size="sm" variant="outline">Apply</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            Review Sentiment Analysis
                        </CardTitle>
                        <CardDescription>Category-wise guest satisfaction</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sentimentData.map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="text-sm font-medium w-24">{item.category}</span>
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                                            style={{ width: `${(item.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold w-10">{item.score}</span>
                                    {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                    {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                    {item.trend === 'stable' && <span className="text-muted-foreground">—</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Occupancy Forecast */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-violet-500" />
                        30-Day Occupancy Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-1 h-40">
                        {Array.from({ length: 30 }, (_, i) => {
                            const val = 60 + Math.sin(i / 4) * 20 + Math.random() * 15
                            const capped = Math.min(val, 100)
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full relative">
                                        <div
                                            className={`w-full rounded-t transition-all duration-300 ${capped > 90 ? 'bg-red-500' : capped > 75 ? 'bg-amber-500' : 'bg-primary'} group-hover:opacity-80`}
                                            style={{ height: `${capped * 1.4}px` }}
                                        />
                                    </div>
                                    {i % 5 === 0 && <span className="text-[9px] text-muted-foreground">{i + 1}</span>}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-primary" /> Normal</span>
                        <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-amber-500" /> High</span>
                        <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-red-500" /> Peak</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
