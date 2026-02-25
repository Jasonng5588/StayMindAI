"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Plus, MoreHorizontal, Eye, Mail, Phone, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const customers = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+1-305-555-0201', city: 'New York, NY', totalBookings: 5, totalSpent: 4485, lastVisit: '2026-02-23', vip: true },
    { id: '2', name: 'Michael Chen', email: 'michael@email.com', phone: '+1-305-555-0202', city: 'San Francisco, CA', totalBookings: 3, totalSpent: 2694, lastVisit: '2026-02-24', vip: false },
    { id: '3', name: 'Emma Williams', email: 'emma@email.com', phone: '+1-305-555-0203', city: 'Chicago, IL', totalBookings: 2, totalSpent: 716, lastVisit: '2026-02-21', vip: false },
    { id: '4', name: 'James Brown', email: 'james@email.com', phone: '+1-305-555-0204', city: 'Miami, FL', totalBookings: 8, totalSpent: 7176, lastVisit: '2026-02-20', vip: true },
    { id: '5', name: 'Lisa Davis', email: 'lisa@email.com', phone: '+1-305-555-0205', city: 'Austin, TX', totalBookings: 1, totalSpent: 898, lastVisit: '2026-02-19', vip: false },
    { id: '6', name: 'Robert Wilson', email: 'robert@email.com', phone: '+1-305-555-0206', city: 'Seattle, WA', totalBookings: 4, totalSpent: 3580, lastVisit: '2026-02-18', vip: true },
    { id: '7', name: 'Alice Martin', email: 'alice@email.com', phone: '+1-305-555-0207', city: 'Denver, CO', totalBookings: 2, totalSpent: 1794, lastVisit: '2026-02-15', vip: false },
    { id: '8', name: 'David Lee', email: 'david@email.com', phone: '+1-305-555-0208', city: 'Portland, OR', totalBookings: 1, totalSpent: 179, lastVisit: '2026-02-10', vip: false },
]

export default function CustomersPage() {
    const [search, setSearch] = useState('')
    const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">Guest database and booking history</p>
                </div>
                <Button><Plus className="h-4 w-4 mr-2" />Add Guest</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{customers.length}</p><p className="text-sm text-muted-foreground">Total Guests</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{customers.filter(c => c.vip).length}</p><p className="text-sm text-muted-foreground">VIP Guests</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">${(customers.reduce((a, c) => a + c.totalSpent, 0) / 1000).toFixed(1)}K</p><p className="text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{(customers.reduce((a, c) => a + c.totalBookings, 0) / customers.length).toFixed(1)}</p><p className="text-sm text-muted-foreground">Avg Bookings</p></CardContent></Card>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Guest</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bookings</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Spent</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Visit</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(customer => (
                                    <tr key={customer.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium">{customer.name}</p>
                                                        {customer.vip && <Badge variant="warning" className="text-[10px] px-1.5">VIP</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{customer.email}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{customer.phone}</p>
                                        </td>
                                        <td className="p-4"><p className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{customer.city}</p></td>
                                        <td className="p-4"><p className="text-sm font-medium">{customer.totalBookings}</p></td>
                                        <td className="p-4"><p className="text-sm font-semibold text-emerald-600">${customer.totalSpent.toLocaleString()}</p></td>
                                        <td className="p-4"><p className="text-sm">{customer.lastVisit}</p></td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem><Calendar className="h-4 w-4 mr-2" />Booking History</DropdownMenuItem>
                                                    <DropdownMenuItem><Mail className="h-4 w-4 mr-2" />Send Email</DropdownMenuItem>
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
        </div>
    )
}
