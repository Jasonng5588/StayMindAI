"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, User, Clock, CheckCircle2, ArrowRight, Plus } from 'lucide-react'

type HKStatus = 'pending' | 'in_progress' | 'completed' | 'verified'

interface Task {
    id: string
    room: string
    floor: number
    assignee: string
    status: HKStatus
    priority: string
    scheduledTime: string
    notes: string
}

const initialTasks: Task[] = [
    { id: '1', room: '101', floor: 1, assignee: 'Priya Patel', status: 'pending', priority: 'high', scheduledTime: '10:00 AM', notes: 'Full clean – guest checkout' },
    { id: '2', room: '201', floor: 2, assignee: 'Priya Patel', status: 'in_progress', priority: 'medium', scheduledTime: '11:00 AM', notes: 'Refresh towels and linens' },
    { id: '3', room: '302', floor: 3, assignee: 'Maria Santos', status: 'pending', priority: 'high', scheduledTime: '10:30 AM', notes: 'Deep clean requested' },
    { id: '4', room: '103', floor: 1, assignee: 'Maria Santos', status: 'completed', priority: 'low', scheduledTime: '09:00 AM', notes: 'Standard turn' },
    { id: '5', room: '202', floor: 2, assignee: 'Priya Patel', status: 'verified', priority: 'medium', scheduledTime: '08:30 AM', notes: 'Standard turn' },
    { id: '6', room: '304', floor: 3, assignee: 'Maria Santos', status: 'pending', priority: 'urgent', scheduledTime: '12:00 PM', notes: 'VIP guest arriving' },
]

const columns: { status: HKStatus; label: string; color: string }[] = [
    { status: 'pending', label: 'Pending', color: 'bg-amber-500' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { status: 'completed', label: 'Completed', color: 'bg-emerald-500' },
    { status: 'verified', label: 'Verified', color: 'bg-violet-500' },
]

const priorityColors: Record<string, string> = {
    urgent: 'destructive',
    high: 'warning',
    medium: 'default',
    low: 'secondary',
}

export default function HousekeepingPage() {
    const [tasks, setTasks] = useState(initialTasks)

    const moveTask = (taskId: string, newStatus: HKStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Housekeeping</h1>
                    <p className="text-muted-foreground">Manage cleaning tasks and schedules</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {columns.map(col => (
                    <Card key={col.status}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${col.color}`} />
                            <div>
                                <p className="text-2xl font-bold">{tasks.filter(t => t.status === col.status).length}</p>
                                <p className="text-sm text-muted-foreground">{col.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map(col => (
                    <div key={col.status} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                            <h3 className="font-semibold text-sm">{col.label}</h3>
                            <Badge variant="outline" className="ml-auto text-xs">
                                {tasks.filter(t => t.status === col.status).length}
                            </Badge>
                        </div>
                        <div className="space-y-3 min-h-[200px]">
                            {tasks
                                .filter(t => t.status === col.status)
                                .map(task => (
                                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-all">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold">Room {task.room}</span>
                                                <Badge variant={priorityColors[task.priority] as 'default'}>
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{task.notes}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                <span>{task.assignee}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>{task.scheduledTime}</span>
                                            </div>
                                            {/* Action buttons */}
                                            {col.status !== 'verified' && (
                                                <div className="pt-2 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full text-xs"
                                                        onClick={() => {
                                                            const next = columns[columns.findIndex(c => c.status === col.status) + 1]
                                                            if (next) moveTask(task.id, next.status)
                                                        }}
                                                    >
                                                        Move to {columns[columns.findIndex(c => c.status === col.status) + 1]?.label}
                                                        <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
