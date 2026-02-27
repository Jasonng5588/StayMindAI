"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard, Hotel, BarChart3, Brain, LifeBuoy, Settings, LogOut,
    Sun, Moon, Menu, X, ShieldCheck, Users, CreditCard, Crown, Image, Ticket, Bell,
} from 'lucide-react'

const adminNav = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Hotels', href: '/admin/hotels', icon: Hotel },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Customers', href: '/admin/customers', icon: Users },
    { title: 'Payments', href: '/admin/payments', icon: CreditCard },
    { title: 'Loyalty', href: '/admin/loyalty', icon: Crown },
    { title: 'Banners', href: '/admin/banners', icon: Image },
    { title: 'Vouchers', href: '/admin/vouchers', icon: Ticket },
    { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { title: 'Support', href: '/admin/support', icon: LifeBuoy },
    { title: 'Notifications', href: '/admin/notifications', icon: Bell },
    { title: 'AI Monitor', href: '/admin/ai-monitor', icon: Brain },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [darkMode, setDarkMode] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [authed, setAuthed] = useState(false)
    const [checking, setChecking] = useState(true)

    const isLoginPage = pathname === '/admin/login'

    useEffect(() => {
        setDarkMode(document.documentElement.classList.contains('dark'))
        if (isLoginPage) { setChecking(false); setAuthed(true); return }
        const auth = localStorage.getItem('admin_auth')
        if (auth) {
            try {
                const parsed = JSON.parse(auth)
                if (parsed.loggedIn) { setAuthed(true); setChecking(false); return }
            } catch { }
        }
        router.replace('/admin/login')
    }, [isLoginPage, router])

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        document.documentElement.classList.toggle('dark', newMode)
        localStorage.setItem('theme', newMode ? 'dark' : 'light')
    }

    const handleSignOut = () => {
        localStorage.removeItem('admin_auth')
        router.push('/admin/login')
    }

    if (isLoginPage) return <>{children}</>
    if (checking || !authed) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return (
        <div className="min-h-screen bg-background flex">
            {/* ── Left Sidebar ──────────────────────────────── */}
            <aside className={cn(
                'fixed inset-y-0 left-0 z-50 w-60 bg-background border-r border-border/50 flex flex-col transition-transform duration-300',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                'lg:translate-x-0 lg:static lg:flex'
            )}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm flex-shrink-0">A</div>
                    <span className="font-bold text-base">Admin Panel</span>
                    <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {adminNav.map(item => {
                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-orange-500')} />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom actions */}
                <div className="p-3 border-t border-border/50 space-y-1">
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent w-full"
                    >
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Main content area ─────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (mobile only) */}
                <header className="sticky top-0 z-30 lg:hidden border-b border-border/50 bg-background/80 backdrop-blur-md h-14 flex items-center px-4 gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-bold">Admin Panel</span>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-orange-500" /> Admin
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
