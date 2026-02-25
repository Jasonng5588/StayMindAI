"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Save, Loader2, CheckCircle2, Hotel, User, Lock, LogOut } from 'lucide-react'

export default function DashboardSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [profile, setProfile] = useState({ fullName: '', email: '', hotelName: '', phone: '' })
    const [passwordData, setPasswordData] = useState({ newPass: '', confirm: '' })
    const [passwordMsg, setPasswordMsg] = useState('')

    useEffect(() => {
        import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient()
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) {
                    setProfile({
                        fullName: data.user.user_metadata?.full_name || '',
                        email: data.user.email || '',
                        hotelName: data.user.user_metadata?.hotel_name || '',
                        phone: data.user.user_metadata?.phone || '',
                    })
                }
            })
        })
    }, [])

    const handleSave = async () => {
        setLoading(true); setSaved(false)
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            await supabase.auth.updateUser({
                data: { full_name: profile.fullName, hotel_name: profile.hotelName, phone: profile.phone },
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch { alert('Save failed') } finally { setLoading(false) }
    }

    const handleChangePassword = async () => {
        setPasswordMsg('')
        if (passwordData.newPass !== passwordData.confirm) { setPasswordMsg('Passwords do not match'); return }
        if (passwordData.newPass.length < 6) { setPasswordMsg('Password must be at least 6 characters'); return }
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password: passwordData.newPass })
            if (error) { setPasswordMsg(error.message); return }
            setPasswordMsg('Password updated successfully!')
            setPasswordData({ newPass: '', confirm: '' })
        } catch { setPasswordMsg('Failed to update password') }
    }

    const handleSignOut = async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login'); router.refresh()
    }

    const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-muted-foreground">Manage your account</p></div>

            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20"><AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{initials}</AvatarFallback></Avatar>
                <div><h2 className="text-xl font-semibold">{profile.fullName || 'Hotel Owner'}</h2><p className="text-muted-foreground">{profile.email}</p></div>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div><label className="text-sm font-medium block mb-1.5">Full Name</label><Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Email (read-only)</label><Input value={profile.email} disabled className="opacity-60" /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Phone</label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1-555-000-0000" /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Hotel Name</label><Input value={profile.hotelName} onChange={(e) => setProfile({ ...profile, hotelName: e.target.value })} /></div>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Save className="h-4 w-4 mr-2" />}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input type="password" placeholder="New password" value={passwordData.newPass} onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })} />
                    <Input type="password" placeholder="Confirm new password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                    {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-emerald-600' : 'text-destructive'}`}>{passwordMsg}</p>}
                    <Button variant="outline" onClick={handleChangePassword}>Update Password</Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-5">
                    <Button variant="destructive" onClick={handleSignOut} className="w-full"><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
                </CardContent>
            </Card>
        </div>
    )
}
