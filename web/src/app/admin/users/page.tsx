"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Search, Shield, Ban, CheckCircle2, X, UserCheck, UserX, Loader2, Mail, Eye } from 'lucide-react'

interface UserProfile {
    id: string; full_name: string; email: string; phone: string; role: string
    is_active: boolean; created_at: string; last_sign_in: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [viewUser, setViewUser] = useState<UserProfile | null>(null)

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/data?type=users')
            if (!res.ok) { setLoading(false); return }
            const { profiles } = await res.json()
            if (profiles) {
                setUsers(profiles.map((p: Record<string, unknown>) => ({
                    id: p.id as string,
                    full_name: (p.full_name as string) || (p.email as string)?.split('@')[0] || 'Unknown',
                    email: (p.email as string) || '',
                    phone: (p.phone as string) || '',
                    role: (p.role as string) || 'guest',
                    is_active: p.is_active !== false,
                    created_at: p.created_at as string,
                    last_sign_in: (p.last_sign_in_at as string) || (p.updated_at as string) || '',
                })))
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const updateRole = async (id: string, role: string) => {
        try {
            await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_role', user_id: id, role })
            })
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
            if (viewUser?.id === id) setViewUser(prev => prev ? { ...prev, role } : null)
        } catch (err) { console.error(err) }
    }

    const toggleSuspend = async (id: string) => {
        const user = users.find(u => u.id === id)
        if (!user) return
        try {
            await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_suspend', user_id: id, is_active: !user.is_active })
            })
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
            if (viewUser?.id === id) setViewUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
        } catch (err) { console.error(err) }
    }

    const filtered = users.filter(u => {
        const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'all' || u.role === roleFilter
        return matchSearch && matchRole
    })

    const counts = { admin: users.filter(u => u.role === 'admin').length, staff: users.filter(u => u.role === 'staff').length, guest: users.filter(u => u.role === 'guest').length }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading users...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10"><Users className="h-5 w-5 text-indigo-600" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight">User Management</h1><p className="text-muted-foreground">{users.length} total users</p></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer" onClick={() => setRoleFilter('all')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-muted-foreground">All Users</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setRoleFilter('admin')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{counts.admin}</p><p className="text-sm text-muted-foreground">Admins</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setRoleFilter('staff')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{counts.staff}</p><p className="text-sm text-muted-foreground">Staff</p></CardContent></Card>
                <Card className="cursor-pointer" onClick={() => setRoleFilter('guest')}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-500">{counts.guest}</p><p className="text-sm text-muted-foreground">Guests</p></CardContent></Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                    {['all', 'admin', 'staff', 'guest'].map(r => (
                        <Button key={r} variant={roleFilter === r ? 'default' : 'outline'} size="sm" onClick={() => setRoleFilter(r)}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium">User</th>
                                <th className="text-left p-3 font-medium">Role</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-left p-3 font-medium">Joined</th>
                                <th className="text-center p-3 font-medium">Actions</th>
                            </tr></thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                                <div><p className="font-medium">{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <select className="text-xs border rounded px-2 py-1 bg-background" value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                                                <option value="guest">Guest</option><option value="staff">Staff</option><option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-3"><Badge variant={u.is_active ? 'success' : 'destructive'}>{u.is_active ? 'Active' : 'Suspended'}</Badge></td>
                                        <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(u)} title="View"><Eye className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSuspend(u.id)} title={u.is_active ? 'Suspend' : 'Activate'}>
                                                    {u.is_active ? <UserX className="h-3.5 w-3.5 text-red-500" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewUser(null)}>
                    <Card className="w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">User Details</h2>
                                <Button variant="ghost" size="icon" onClick={() => setViewUser(null)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary/10 text-primary text-lg">{viewUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                <div>
                                    <h3 className="font-bold text-lg">{viewUser.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Role</span><Badge variant="secondary">{viewUser.role}</Badge></div>
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Status</span><Badge variant={viewUser.is_active ? 'success' : 'destructive'}>{viewUser.is_active ? 'Active' : 'Suspended'}</Badge></div>
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Phone</span><span>{viewUser.phone || 'Not set'}</span></div>
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Joined</span><span>{new Date(viewUser.created_at).toLocaleDateString()}</span></div>
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">User ID</span><span className="font-mono text-xs">{viewUser.id.slice(0, 12)}...</span></div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant={viewUser.is_active ? 'destructive' : 'default'} className="flex-1" onClick={() => toggleSuspend(viewUser.id)}>
                                    {viewUser.is_active ? <><Ban className="h-4 w-4 mr-2" />Suspend</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Activate</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
