"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard, Hotel, BarChart3, Brain, LifeBuoy, Settings, LogOut,
    Sun, Moon, Menu, X, ShieldCheck, Users, CreditCard, Crown, Image, Ticket,
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
    { title: 'AI Monitor', href: '/admin/ai-monitor', icon: Brain },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [darkMode, setDarkMode] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [authed, setAuthed] = useState(false)
    const [checking, setChecking] = useState(true)

    // Skip layout for login page
    const isLoginPage = pathname === '/admin/login' || pathname === '/admin'

    useEffect(() => {
        setDarkMode(document.documentElement.classList.contains('dark'))

        if (isLoginPage) {
            setChecking(false)
            setAuthed(true) // login page renders itself
            return
        }

        const auth = localStorage.getItem('admin_auth')
        if (auth) {
            try {
                const parsed = JSON.parse(auth)
                if (parsed.loggedIn) {
                    setAuthed(true)
                    setChecking(false)
                    return
                }
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

    // Login page — no layout chrome
    if (isLoginPage) return <>{children}</>

    if (checking || !authed) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                            <Link href="/admin/dashboard" className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-lg">A</div>
                                <span className="font-bold text-lg hidden sm:block">Admin Panel</span>
                            </Link>
                        </div>

                        <nav className="hidden md:flex items-center gap-1">
                            {adminNav.map(item => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                            isActive ? 'bg-orange-500/10 text-orange-600' : 'text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-1">
                                <ShieldCheck className="h-4 w-4 text-orange-500" /> Admin
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-border/50 bg-background p-3 space-y-1">
                        {adminNav.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                                        isActive ? 'bg-orange-500/10 text-orange-600' : 'text-muted-foreground'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    )
}
