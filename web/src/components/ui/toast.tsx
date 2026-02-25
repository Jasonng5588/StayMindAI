"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (type: ToastType, title: string, message?: string) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`
        setToasts(prev => [...prev, { id, type, title, message }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }

    const colors: Record<ToastType, string> = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
    }

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="flex items-start gap-3 p-4 rounded-xl bg-card border shadow-lg animate-slide-in-right"
                    >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${colors[toast.type]} text-white text-xs font-bold shrink-0`}>
                            {icons[toast.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{toast.title}</p>
                            {toast.message && <p className="text-xs text-muted-foreground mt-0.5">{toast.message}</p>}
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground text-sm shrink-0">✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}
