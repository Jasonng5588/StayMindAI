"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Search, MoreHorizontal, Mail, Phone, Edit, Trash2, Shield, Save, X } from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StaffMember {
    id: string; name: string; email: string; phone: string; position: string; department: string; status: string; shift: string
}

const initialStaff: StaffMember[] = [
    { id: '1', name: 'Alex Rivera', email: 'alex@grandazure.com', phone: '+1-305-555-0101', position: 'Front Desk Manager', department: 'Reception', status: 'active', shift: 'Morning' },
    { id: '2', name: 'Priya Patel', email: 'priya@grandazure.com', phone: '+1-305-555-0102', position: 'Housekeeping Lead', department: 'Housekeeping', status: 'active', shift: 'Morning' },
    { id: '3', name: 'Marcus Johnson', email: 'marcus@grandazure.com', phone: '+1-305-555-0103', position: 'Maintenance Tech', department: 'Maintenance', status: 'active', shift: 'Day' },
    { id: '4', name: 'Sofia Garcia', email: 'sofia@grandazure.com', phone: '+1-305-555-0104', position: 'Concierge', department: 'Guest Services', status: 'active', shift: 'Evening' },
    { id: '5', name: 'Chen Wei', email: 'chen@grandazure.com', phone: '+1-305-555-0105', position: 'Night Auditor', department: 'Finance', status: 'active', shift: 'Night' },
    { id: '6', name: 'Emma Taylor', email: 'emma@grandazure.com', phone: '+1-305-555-0106', position: 'Spa Manager', department: 'Wellness', status: 'inactive', shift: 'Day' },
]

export default function StaffPage() {
    const [staffList, setStaffList] = useState(initialStaff)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', position: '', department: '', shift: 'Morning' })

    const departments = [...new Set(staffList.map(s => s.department))]
    const filtered = staffList.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.position.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    )

    const openAddForm = () => {
        setEditingId(null)
        setForm({ name: '', email: '', phone: '', position: '', department: '', shift: 'Morning' })
        setShowForm(true)
    }

    const openEditForm = (s: StaffMember) => {
        setEditingId(s.id)
        setForm({ name: s.name, email: s.email, phone: s.phone, position: s.position, department: s.department, shift: s.shift })
        setShowForm(true)
    }

    const handleSave = () => {
        if (!form.name || !form.email || !form.position) { alert('Please fill name, email, and position'); return }
        if (editingId) {
            setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s))
        } else {
            setStaffList(prev => [{ id: `s-${Date.now()}`, ...form, status: 'active' }, ...prev])
        }
        setShowForm(false); setEditingId(null)
    }

    const handleDelete = (id: string) => {
        if (confirm('Remove this staff member?')) setStaffList(prev => prev.filter(s => s.id !== id))
    }

    const toggleStatus = (id: string) => {
        setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
                    <p className="text-muted-foreground">Manage your hotel team</p>
                </div>
                <Button onClick={openAddForm}>
                    <Plus className="h-4 w-4 mr-2" /> Add Staff
                </Button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="border-primary/20">
                    <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Staff Member</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium block mb-1.5">Full Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Email *</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@hotel.com" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-000-0000" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Position *</label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Front Desk Manager" /></div>
                            <div><label className="text-sm font-medium block mb-1.5">Department</label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Reception" /></div>
                            <div>
                                <label className="text-sm font-medium block mb-1.5">Shift</label>
                                <div className="flex gap-2">
                                    {['Morning', 'Day', 'Evening', 'Night'].map(s => (
                                        <Button key={s} variant={form.shift === s ? 'default' : 'outline'} size="sm" onClick={() => setForm({ ...form, shift: s })}>{s}</Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> {editingId ? 'Update' : 'Add'}</Button>
                            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {departments.map(dept => (
                    <Card key={dept}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{staffList.filter(s => s.department === dept).length}</p>
                            <p className="text-xs text-muted-foreground">{dept}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(member => (
                    <Card key={member.id} className="hover:shadow-lg transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold truncate">{member.name}</h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditForm(member)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(member.id)}>
                                                    <Shield className="h-4 w-4 mr-2" /> {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(member.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{member.position}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Badge variant="outline">{member.department}</Badge>
                                        <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>{member.status}</Badge>
                                        <Badge variant="outline">{member.shift}</Badge>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {member.email}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {member.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
