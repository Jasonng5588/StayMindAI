"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Check, Zap, Building2, ArrowRight, ExternalLink, FileText } from 'lucide-react'

const plans = [
    { id: 'starter', name: 'Starter', price: 49, rooms: 20, features: ['Basic analytics', 'Email support', 'Mobile app access', 'Standard AI insights'] },
    { id: 'professional', name: 'Professional', price: 149, rooms: 100, features: ['AI insights', 'Priority support', 'Dynamic pricing', 'Marketing tools', 'CSV/PDF exports'] },
    { id: 'enterprise', name: 'Enterprise', price: 399, rooms: 999, features: ['Unlimited rooms', 'Custom AI models', '24/7 support', 'API access', 'White-label', 'Multi-property', 'Dedicated manager'] },
]

const invoices = [
    { id: 'INV-2026-002', date: '2026-02-01', amount: 149, status: 'paid', plan: 'Professional' },
    { id: 'INV-2026-001', date: '2026-01-01', amount: 149, status: 'paid', plan: 'Professional' },
    { id: 'INV-2025-012', date: '2025-12-01', amount: 49, status: 'paid', plan: 'Starter' },
    { id: 'INV-2025-011', date: '2025-11-01', amount: 49, status: 'paid', plan: 'Starter' },
]

export default function BillingPage() {
    const [currentPlan] = useState('professional')

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">Manage your subscription and payment methods</p>
            </div>

            {/* Current Plan */}
            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold">Professional Plan</h3>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">$149/month • Up to 100 rooms • Renews March 1, 2026</p>
                            </div>
                        </div>
                        <Button variant="outline">Manage Subscription</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                            <div>
                                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                                <p className="text-xs text-muted-foreground">Expires 12/2028</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Update</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>Upgrade or downgrade your subscription</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div key={plan.id} className={`p-5 rounded-xl border ${plan.id === currentPlan ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold">{plan.name}</h3>
                                    {plan.id === currentPlan && <Badge>Current</Badge>}
                                </div>
                                <p className="text-3xl font-bold">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                <p className="text-xs text-muted-foreground mt-1">Up to {plan.rooms === 999 ? 'unlimited' : plan.rooms} rooms</p>
                                <ul className="mt-4 space-y-2">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-3.5 w-3.5 text-primary shrink-0" />{f}</li>
                                    ))}
                                </ul>
                                <Button className="w-full mt-4" variant={plan.id === currentPlan ? 'secondary' : 'outline'} disabled={plan.id === currentPlan}>
                                    {plan.id === currentPlan ? 'Current Plan' : plan.price > 149 ? 'Upgrade' : 'Downgrade'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Invoice History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Plan</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Amount</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id} className="border-b hover:bg-muted/30">
                                    <td className="p-3 text-sm font-mono">{inv.id}</td>
                                    <td className="p-3 text-sm">{inv.date}</td>
                                    <td className="p-3 text-sm">{inv.plan}</td>
                                    <td className="p-3 text-sm font-semibold">${inv.amount}</td>
                                    <td className="p-3"><Badge variant="success">{inv.status}</Badge></td>
                                    <td className="p-3 text-right"><Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3 mr-1" />Download</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
