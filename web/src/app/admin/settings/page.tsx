"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, CheckCircle2, Loader2, Shield, Globe, Mail, Bell } from 'lucide-react'

export default function AdminSettingsPage() {
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        platformName: 'StayMind AI',
        supportEmail: 'support@staymind.ai',
        maxHotelsPerOwner: '10',
        trialDays: '14',
        commissionRate: '5',
        enableGoogleAuth: true,
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        maintenanceMode: false,
    })

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/admin/data?type=settings')
                if (res.ok) {
                    const data = await res.json()
                    if (data.settings && Object.keys(data.settings).length > 0) {
                        setSettings(prev => ({ ...prev, ...data.settings }))
                    }
                }
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save_settings', settings })
            })
            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    const updateField = (field: string, value: string | boolean) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Platform configuration</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Save className="h-4 w-4 mr-2" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                </Button>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div><label className="text-sm font-medium block mb-1.5">Platform Name</label><Input value={settings.platformName} onChange={(e) => updateField('platformName', e.target.value)} /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Support Email</label><Input value={settings.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-sm font-medium block mb-1.5">Max Hotels Per Owner</label><Input type="number" value={settings.maxHotelsPerOwner} onChange={(e) => updateField('maxHotelsPerOwner', e.target.value)} /></div>
                        <div><label className="text-sm font-medium block mb-1.5">Trial Days</label><Input type="number" value={settings.trialDays} onChange={(e) => updateField('trialDays', e.target.value)} /></div>
                        <div><label className="text-sm font-medium block mb-1.5">Commission (%)</label><Input type="number" value={settings.commissionRate} onChange={(e) => updateField('commissionRate', e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Google OAuth', field: 'enableGoogleAuth', desc: 'Allow users to sign in with Google' },
                        { label: 'Maintenance Mode', field: 'maintenanceMode', desc: 'Show maintenance page to all users' },
                    ].map(item => (
                        <label key={item.field} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                            <div>
                                <p className="font-medium text-sm">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings[item.field as keyof typeof settings] as boolean}
                                onChange={(e) => updateField(item.field, e.target.checked)}
                                className="h-5 w-5 accent-primary"
                            />
                        </label>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Email Notifications', field: 'enableEmailNotifications', desc: 'Send email alerts for important events' },
                        { label: 'SMS Notifications', field: 'enableSMSNotifications', desc: 'Send SMS alerts (additional charges apply)' },
                    ].map(item => (
                        <label key={item.field} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                            <div>
                                <p className="font-medium text-sm">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings[item.field as keyof typeof settings] as boolean}
                                onChange={(e) => updateField(item.field, e.target.checked)}
                                className="h-5 w-5 accent-primary"
                            />
                        </label>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
