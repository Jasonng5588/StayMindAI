"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
    const router = useRouter()

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth')
        if (auth) {
            try {
                const parsed = JSON.parse(auth)
                if (parsed.loggedIn) {
                    router.replace('/admin/dashboard')
                    return
                }
            } catch { }
        }
        router.replace('/admin/login')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )
}
