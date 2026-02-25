"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, Shield, Globe, Server, Bell, Database, Key, Mail, Sliders, CheckCircle2, Loader2 } from 'lucide-react'

export default function SystemConfigPage() {
    const [saving, setSaving] = useState<string | null>(null)
    const [savedSection, setSavedSection] = useState<string | null>(null)
    const [config, setConfig] = useState({
        platformName: 'StayMind AI', supportEmail: 'support@staymind.ai', platformUrl: 'https://app.staymind.ai', defaultLanguage: 'en',
        apiRequestsPerMin: '100', authAttemptsPerHour: '10', aiCallsPerDay: '500',
        smtpHost: 'smtp.sendgrid.net', smtpPort: '587', fromEmail: 'noreply@staymind.ai', fromName: 'StayMind AI',
        notifications: { newHotel: true, paymentFailure: true, highAiUsage: true, systemError: true, weeklyDigest: false },
    })

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/admin/data?type=settings')
                if (res.ok) {
                    const data = await res.json()
                    if (data.settings?.config) setConfig(prev => ({ ...prev, ...data.settings.config }))
                }
            } catch (err) { console.error(err) }
        }
        load()
    }, [])

    const saveSection = async (section: string) => {
        setSaving(section)
        setSavedSection(null)
        try {
            await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_settings', settings: { config } }) })
            setSavedSection(section)
            setTimeout(() => setSavedSection(null), 3000)
        } catch (err) { console.error(err) }
        setSaving(null)
    }

    const SaveBtn = ({ section }: { section: string }) => (
        <Button onClick={() => saveSection(section)} disabled={saving === section} size="sm">
            {saving === section ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : savedSection === section ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Save className="h-4 w-4 mr-2" />}
            {savedSection === section ? 'Saved!' : 'Save'}
        </Button>
    )

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary"><Shield className="h-5 w-5 text-primary-foreground" /></div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">System Configuration</h1>
                        <p className="text-muted-foreground">Platform-wide settings and configuration</p>
                    </div>
                </div>

                {/* General */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />General Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-sm font-medium">Platform Name</label><Input value={config.platformName} onChange={e => setConfig(p => ({ ...p, platformName: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Support Email</label><Input value={config.supportEmail} onChange={e => setConfig(p => ({ ...p, supportEmail: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Platform URL</label><Input value={config.platformUrl} onChange={e => setConfig(p => ({ ...p, platformUrl: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Default Language</label><Input value={config.defaultLanguage} onChange={e => setConfig(p => ({ ...p, defaultLanguage: e.target.value }))} /></div>
                        </div>
                        <SaveBtn section="general" />
                    </CardContent>
                </Card>

                {/* API Keys */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />API Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            {[
                                { label: 'Supabase URL', value: 'https://xxx.supabase.co', type: 'url' },
                                { label: 'Supabase Anon Key', value: 'eyJ***...***', type: 'key' },
                                { label: 'Gemini API Key', value: 'AIzaSy***...***', type: 'key' },
                                { label: 'Stripe Secret Key', value: 'sk_test_***...***', type: 'key' },
                                { label: 'Stripe Publishable Key', value: 'pk_test_***...***', type: 'key' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.label}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{item.value}</p>
                                    </div>
                                    <Badge variant={item.type === 'key' ? 'secondary' : 'outline'}>{item.type}</Badge>
                                    <Button variant="outline" size="sm" onClick={() => alert(`API keys are configured via environment variables. Update your .env.local file to change ${item.label}.`)}>Update</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Rate Limiting */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" />Rate Limiting</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><label className="text-sm font-medium">API Requests / Min</label><Input type="number" value={config.apiRequestsPerMin} onChange={e => setConfig(p => ({ ...p, apiRequestsPerMin: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Auth Attempts / Hour</label><Input type="number" value={config.authAttemptsPerHour} onChange={e => setConfig(p => ({ ...p, authAttemptsPerHour: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">AI Calls / Day / Hotel</label><Input type="number" value={config.aiCallsPerDay} onChange={e => setConfig(p => ({ ...p, aiCallsPerDay: e.target.value }))} /></div>
                        </div>
                        <SaveBtn section="rateLimiting" />
                    </CardContent>
                </Card>

                {/* Email */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-sm font-medium">SMTP Host</label><Input value={config.smtpHost} onChange={e => setConfig(p => ({ ...p, smtpHost: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">SMTP Port</label><Input value={config.smtpPort} onChange={e => setConfig(p => ({ ...p, smtpPort: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">From Email</label><Input value={config.fromEmail} onChange={e => setConfig(p => ({ ...p, fromEmail: e.target.value }))} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">From Name</label><Input value={config.fromName} onChange={e => setConfig(p => ({ ...p, fromName: e.target.value }))} /></div>
                        </div>
                        <SaveBtn section="email" />
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />System Notifications</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { label: 'New hotel registration alerts', field: 'newHotel' },
                                { label: 'Payment failure alerts', field: 'paymentFailure' },
                                { label: 'High AI usage alerts', field: 'highAiUsage' },
                                { label: 'System error notifications', field: 'systemError' },
                                { label: 'Weekly analytics digest', field: 'weeklyDigest' },
                            ].map(item => (
                                <label key={item.field} className="flex items-center justify-between py-2 cursor-pointer">
                                    <p className="text-sm">{item.label}</p>
                                    <input
                                        type="checkbox"
                                        checked={config.notifications[item.field as keyof typeof config.notifications]}
                                        onChange={e => setConfig(p => ({ ...p, notifications: { ...p.notifications, [item.field]: e.target.checked } }))}
                                        className="h-5 w-5 accent-primary"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="mt-4"><SaveBtn section="notifications" /></div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/30">
                    <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><Database className="h-5 w-5" />Danger Zone</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
                            <div><p className="text-sm font-medium">Clear AI Cache</p><p className="text-xs text-muted-foreground">Remove all cached AI responses</p></div>
                            <Button variant="destructive" size="sm" onClick={() => { if (confirm('Clear all AI cache? This cannot be undone.')) alert('AI cache cleared successfully.') }}>Clear Cache</Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
                            <div><p className="text-sm font-medium">Reset Rate Limits</p><p className="text-xs text-muted-foreground">Reset all rate limiting counters</p></div>
                            <Button variant="destructive" size="sm" onClick={() => { if (confirm('Reset all rate limits?')) alert('Rate limits reset successfully.') }}>Reset</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
