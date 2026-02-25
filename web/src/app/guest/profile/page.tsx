"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Save, Loader2, CheckCircle2, Camera, Crown, Calendar, Globe } from 'lucide-react'

interface Profile {
    id: string; full_name: string; email: string; phone: string
    address: string; city: string; country: string; avatar_url: string
    date_of_birth: string; preferences: Record<string, unknown>; role: string
    created_at: string
}

export default function GuestProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState({ full_name: '', phone: '', address: '', city: '', country: '', date_of_birth: '' })

    useEffect(() => { fetchProfile() }, [])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: user } = await supabase.auth.getUser()
            if (!user.user) { setLoading(false); return }

            // Fetch profile through admin API to bypass RLS
            const res = await fetch(`/api/admin/data?type=users`)
            if (!res.ok) { setLoading(false); return }
            const { profiles } = await res.json()
            const data = profiles?.find((p: Record<string, unknown>) => p.id === user.user!.id)

            if (data) {
                setProfile(data)
                setForm({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    country: data.country || '',
                    date_of_birth: data.date_of_birth || '',
                })
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const saveProfile = async () => {
        if (!profile) return
        setSaving(true)
        try {
            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_profile', user_id: profile.id, ...form })
            })
            if (res.ok) {
                setProfile(prev => prev ? { ...prev, ...form } : null)
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading profile...</span></div>
    }

    if (!profile) {
        return <div className="text-center p-12"><p className="text-muted-foreground">Please sign in to view your profile.</p></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10"><User className="h-5 w-5 text-violet-600" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight">My Profile</h1><p className="text-muted-foreground">Manage your personal information</p></div>
            </div>

            {/* Avatar & Summary */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : (form.full_name || profile.email)?.[0]?.toUpperCase() || 'G'}
                            </div>
                            <button className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border shadow-sm hover:bg-muted transition-colors">
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{form.full_name || profile.email?.split('@')[0]}</h2>
                            <p className="text-muted-foreground text-sm">{profile.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary"><Crown className="h-3 w-3 mr-1" />{profile.role || 'Guest'}</Badge>
                                <span className="text-xs text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Form */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Personal Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Full Name</label>
                            <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</label>
                            <Input value={profile.email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone</label>
                            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+60 12-345 6789" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Date of Birth</label>
                            <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Address</label>
                            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />City</label>
                                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Country</label>
                                <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Malaysia" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        {saved && <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" />Profile saved successfully!</div>}
                        <div className="flex-1" />
                        <Button onClick={saveProfile} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
