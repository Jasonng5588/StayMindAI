"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    Bell,
    Search,
    Sun,
    Moon,
    LogOut,
    User,
    Settings,
} from 'lucide-react'

interface HeaderProps {
    title?: string
}

export function Header({ title }: HeaderProps) {
    const router = useRouter()
    const [darkMode, setDarkMode] = useState(false)
    const [user, setUser] = useState<{ email: string; name: string; initials: string } | null>(null)

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark')
        setDarkMode(isDark)

        // Fetch user info from Supabase session
        import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient()
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) {
                    const meta = data.user.user_metadata || {}
                    const name = meta.full_name || data.user.email?.split('@')[0] || 'User'
                    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    setUser({
                        email: data.user.email || '',
                        name,
                        initials,
                    })
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-6">
            {title && (
                <h2 className="text-lg font-semibold hidden md:block">{title}</h2>
            )}

            {/* Search */}
            <div className="flex-1 max-w-md ml-auto mr-auto md:mr-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search bookings, guests, rooms..."
                        className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Dark mode toggle */}
                <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
                    <Link href="/dashboard/notifications">
                        <Bell className="h-5 w-5" />
                    </Link>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {user?.initials || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">{user?.name || 'Loading...'}</p>
                                <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
