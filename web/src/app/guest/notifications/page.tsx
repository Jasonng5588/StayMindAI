"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Trash2, Loader2, Inbox } from 'lucide-react'

interface Notification {
    id: string; title: string; message: string; type: string; is_read: boolean; created_at: string
}

const typeIcons: Record<string, string> = { booking: '🏨', payment: '💳', loyalty: '⭐', support: '🔧', announcement: '📢', system: '🔔' }

export default function GuestNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchNotifications() }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/notifications')
            if (!res.ok) { setLoading(false); return }
            const { notifications: data } = await res.json()
            if (data) setNotifications(data)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_ids: [id] })
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (err) { console.error(err) }
    }

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all: true })
            })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) { console.error(err) }
    }

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (err) { console.error(err) }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading notifications...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10"><Bell className="h-5 w-5 text-blue-600" /></div>
                    <div><h1 className="text-2xl font-bold tracking-tight">Notifications</h1><p className="text-muted-foreground">{unreadCount} unread</p></div>
                </div>
                {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" />Mark All Read</Button>}
            </div>

            {notifications.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No notifications</h3>
                    <p className="text-muted-foreground">You&apos;re all caught up!</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <Card key={n.id} className={`transition-all ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
                            <CardContent className="p-4 flex items-start gap-3">
                                <span className="text-xl">{typeIcons[n.type] || '🔔'}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-semibold text-sm ${!n.is_read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                                        {!n.is_read && <Badge className="text-[10px]">New</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{n.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-1">
                                    {!n.is_read && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(n.id)} title="Mark as read"><Check className="h-3.5 w-3.5" /></Button>}
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(n.id)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

