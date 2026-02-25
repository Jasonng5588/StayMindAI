"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Home, CalendarCheck, BedDouble, Star, Bell, MessageCircle, User, LogOut, Sun, Moon,
    LifeBuoy, Crown,
} from 'lucide-react'

const guestNav = [
    { title: 'Home', href: '/guest/dashboard', icon: Home },
    { title: 'Book a Room', href: '/guest/rooms', icon: BedDouble },
    { title: 'My Bookings', href: '/guest/bookings', icon: CalendarCheck },
    { title: 'Reviews', href: '/guest/reviews', icon: Star },
    { title: 'Loyalty', href: '/guest/loyalty', icon: Crown },
    { title: 'Support', href: '/guest/support', icon: LifeBuoy },
    { title: 'AI Chat', href: '/guest/chat', icon: MessageCircle },
    { title: 'Notifications', href: '/guest/notifications', icon: Bell },
    { title: 'Profile', href: '/guest/profile', icon: User },
]

export default function GuestLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [darkMode, setDarkMode] = React.useState(false)
    const [userName, setUserName] = React.useState('')

    React.useEffect(() => {
        setDarkMode(document.documentElement.classList.contains('dark'))
        import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient()
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) {
                    setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Guest')
                }
            })
        })
    }, [])

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        document.documentElement.classList.toggle('dark', newMode)
        localStorage.setItem('theme', newMode ? 'dark' : 'light')
    }

    const handleSignOut = async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/guest/dashboard" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">S</div>
                            <span className="font-bold text-lg gradient-text">StayMind AI</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {guestNav.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
                            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
                            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden border-t border-border/50 overflow-x-auto">
                    <nav className="flex px-4 py-2 gap-1">
                        {guestNav.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                                    )}
                                >
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    )
}
