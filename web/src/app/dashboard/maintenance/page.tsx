"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Wrench, AlertTriangle, Clock, User, MoreHorizontal, Edit, CheckCircle2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const tasks = [
    { id: '1', title: 'AC Unit Not Cooling', room: '302', priority: 'high', status: 'in_progress', assignee: 'Marcus Johnson', category: 'HVAC', cost: 150, reportedAt: '2026-02-23', description: 'Guest reports AC not cooling properly in room 302' },
    { id: '2', title: 'Leaking Faucet', room: '201', priority: 'medium', status: 'reported', assignee: null, category: 'Plumbing', cost: null, reportedAt: '2026-02-24', description: 'Bathroom faucet has a slow drip' },
    { id: '3', title: 'Broken Window Lock', room: '103', priority: 'urgent', status: 'assigned', assignee: 'Marcus Johnson', category: 'Security', cost: 75, reportedAt: '2026-02-24', description: 'Window lock mechanism is jammed and needs replacement' },
    { id: '4', title: 'Light Fixture Replacement', room: 'Lobby', priority: 'low', status: 'completed', assignee: 'Tom Baker', category: 'Electrical', cost: 200, reportedAt: '2026-02-22', description: 'Replace burnt-out chandelier bulbs in main lobby' },
    { id: '5', title: 'Elevator Maintenance', room: 'N/A', priority: 'high', status: 'in_progress', assignee: 'External Vendor', category: 'General', cost: 500, reportedAt: '2026-02-21', description: 'Quarterly elevator inspection and maintenance' },
]

const priorityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    urgent: { color: 'destructive', icon: <AlertTriangle className="h-4 w-4" /> },
    high: { color: 'warning', icon: <AlertTriangle className="h-4 w-4" /> },
    medium: { color: 'default', icon: <Wrench className="h-4 w-4" /> },
    low: { color: 'secondary', icon: <Wrench className="h-4 w-4" /> },
}

const statusConfig: Record<string, string> = {
    reported: 'bg-red-500/10 text-red-600 border-red-500/20',
    assigned: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

export default function MaintenancePage() {
    const [search, setSearch] = useState('')
    const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.room.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">Track and manage maintenance tasks</p>
                </div>
                <Button><Plus className="h-4 w-4 mr-2" />Report Issue</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'reported').length}</p><p className="text-sm text-muted-foreground">Reported</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'in_progress').length}</p><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">${tasks.reduce((a, t) => a + (t.cost || 0), 0)}</p><p className="text-sm text-muted-foreground">Total Cost</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'completed').length}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="space-y-3">
                {filtered.map(task => (
                    <Card key={task.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        <Badge variant={priorityConfig[task.priority].color as 'default'}>{task.priority}</Badge>
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig[task.status]}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{task.category}</span>
                                        <span className="flex items-center gap-1"><span className="font-medium">Room:</span>{task.room}</span>
                                        {task.assignee && <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>}
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.reportedAt}</span>
                                        {task.cost && <span className="font-medium text-foreground">${task.cost}</span>}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                        <DropdownMenuItem><User className="h-4 w-4 mr-2" />Assign</DropdownMenuItem>
                                        <DropdownMenuItem><CheckCircle2 className="h-4 w-4 mr-2" />Mark Complete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
