"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip'
import {
    LayoutDashboard,
    BedDouble,
    CalendarCheck,
    Users,
    Sparkles,
    ClipboardList,
    Wrench,
    Star,
    Megaphone,
    FileBarChart,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    Hotel,
    Brain,
    Tag,
    HelpCircle,
    type LucideIcon,
} from 'lucide-react'

interface NavItem {
    title: string
    href: string
    icon: LucideIcon
    badge?: string
}

const ownerNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Rooms', href: '/dashboard/rooms', icon: BedDouble },
    { title: 'Bookings', href: '/dashboard/bookings', icon: CalendarCheck },
    { title: 'Staff', href: '/dashboard/staff', icon: Users },
    { title: 'Housekeeping', href: '/dashboard/housekeeping', icon: ClipboardList },
    { title: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench },
    { title: 'Customers', href: '/dashboard/customers', icon: Users },
    { title: 'Reviews', href: '/dashboard/reviews', icon: Star },
    { title: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
    { title: 'AI Insights', href: '/dashboard/ai', icon: Brain },
    { title: 'Promo Codes', href: '/dashboard/promos', icon: Tag },
    { title: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
    { title: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Hotels', href: '/admin/hotels', icon: Hotel },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Analytics', href: '/admin/analytics', icon: FileBarChart },
    { title: 'AI Monitor', href: '/admin/ai-monitor', icon: Brain },
    { title: 'Support', href: '/admin/support', icon: HelpCircle },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
]

interface SidebarProps {
    variant?: 'owner' | 'admin'
}

export function Sidebar({ variant = 'owner' }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()
    const navItems = variant === 'admin' ? adminNavItems : ownerNavItems

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-card transition-all duration-300',
                    collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shrink-0">
                        S
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h1 className="font-bold text-lg gradient-text">StayMind</h1>
                            <p className="text-[10px] text-muted-foreground -mt-1">AI Hotel OS</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href))

                            const linkContent = (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                        collapsed && 'justify-center px-2'
                                    )}
                                >
                                    <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                                    {!collapsed && (
                                        <span className="animate-fade-in">{item.title}</span>
                                    )}
                                    {!collapsed && item.badge && (
                                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            )

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                        <TooltipContent side="right">{item.title}</TooltipContent>
                                    </Tooltip>
                                )
                            }

                            return <React.Fragment key={item.href}>{linkContent}</React.Fragment>
                        })}
                    </nav>
                </ScrollArea>

                <Separator />

                {/* Collapse button */}
                <div className="p-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {!collapsed && <span className="ml-2">Collapse</span>}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    )
}
