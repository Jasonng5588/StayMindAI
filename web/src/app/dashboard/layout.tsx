"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar variant="owner" />
            <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300">
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
