"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Megaphone, Sparkles, Tag, Copy, Plus, Calendar, TrendingUp, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const promoCodes = [
    { code: 'WELCOME20', description: 'Welcome discount for new guests', discount: '20%', type: 'percentage', usageLimit: 100, used: 43, validUntil: '2026-05-24', active: true },
    { code: 'SUMMER50', description: 'Summer special – $50 off', discount: '$50', type: 'fixed', usageLimit: 50, used: 12, validUntil: '2026-04-24', active: true },
    { code: 'VIP30', description: 'VIP guest discount', discount: '30%', type: 'percentage', usageLimit: null, used: 8, validUntil: null, active: true },
    { code: 'FLASH10', description: 'Flash sale – 10% off today', discount: '10%', type: 'percentage', usageLimit: 25, used: 25, validUntil: '2026-02-24', active: false },
]

const aiContent = [
    { type: 'Social Post', content: '🌊 Wake up to ocean views at The Grand Azure! Book your dream getaway and save 20% with code WELCOME20. Limited availability — reserve now! #LuxuryTravel #BeachResort', platform: 'Instagram' },
    { type: 'Email Subject', content: 'Your Dream Beach Vacation Awaits – Exclusive 20% Off Inside!', platform: 'Email' },
    { type: 'Ad Copy', content: 'Escape to paradise at The Grand Azure. World-class spa, ocean-view rooms, and personalized service. Starting at $179/night.', platform: 'Google Ads' },
]

export default function MarketingPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
                    <p className="text-muted-foreground">Promo codes and AI-generated marketing content</p>
                </div>
                <Button><Plus className="h-4 w-4 mr-2" />Create Promo Code</Button>
            </div>

            {/* Promo Codes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Promo Codes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Code</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Description</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Discount</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Usage</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Valid Until</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promoCodes.map(promo => (
                                    <tr key={promo.code} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-sm font-semibold">{promo.code}</code>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(promo.code)}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm">{promo.description}</td>
                                        <td className="p-3 text-sm font-semibold">{promo.discount}</td>
                                        <td className="p-3 text-sm">{promo.used}/{promo.usageLimit || '∞'}</td>
                                        <td className="p-3 text-sm">{promo.validUntil || 'No expiry'}</td>
                                        <td className="p-3"><Badge variant={promo.active ? 'success' : 'secondary'}>{promo.active ? 'Active' : 'Expired'}</Badge></td>
                                        <td className="p-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* AI Content Generator */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-500" />AI Marketing Content</CardTitle>
                    <CardDescription>Auto-generated promotional content by Gemini AI</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Button variant="outline"><Sparkles className="h-4 w-4 mr-2" />Generate New Content</Button>
                    </div>
                    <div className="space-y-4">
                        {aiContent.map((content, i) => (
                            <div key={i} className="p-4 rounded-lg bg-muted/50 border">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline">{content.type}</Badge>
                                    <Badge variant="secondary">{content.platform}</Badge>
                                </div>
                                <p className="text-sm">{content.content}</p>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline"><Copy className="h-3 w-3 mr-1" />Copy</Button>
                                    <Button size="sm" variant="ghost"><Sparkles className="h-3 w-3 mr-1" />Regenerate</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
