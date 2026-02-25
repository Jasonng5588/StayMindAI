import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    lines?: number
}

export function Skeleton({ className, variant = 'rectangular', width, height, lines, ...props }: SkeletonProps) {
    const baseClasses = 'skeleton animate-pulse rounded'

    if (variant === 'text' && lines) {
        return (
            <div className={cn('space-y-2', className)} {...props}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(baseClasses, 'h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
                    />
                ))}
            </div>
        )
    }

    if (variant === 'circular') {
        return (
            <div
                className={cn(baseClasses, 'rounded-full')}
                style={{ width: width ?? 40, height: height ?? 40 }}
                {...props}
            />
        )
    }

    if (variant === 'card') {
        return (
            <div className={cn('rounded-xl border p-6 space-y-4', className)} {...props}>
                <div className="flex items-center gap-3">
                    <div className={cn(baseClasses, 'rounded-full')} style={{ width: 40, height: 40 }} />
                    <div className="flex-1 space-y-2">
                        <div className={cn(baseClasses, 'h-4 w-1/3')} />
                        <div className={cn(baseClasses, 'h-3 w-1/2')} />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className={cn(baseClasses, 'h-3 w-full')} />
                    <div className={cn(baseClasses, 'h-3 w-5/6')} />
                    <div className={cn(baseClasses, 'h-3 w-4/6')} />
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn(baseClasses, className)}
            style={{ width: width ?? '100%', height: height ?? 20 }}
            {...props}
        />
    )
}

// Pre-built skeleton layouts
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 p-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton width={200} height={28} />
                    <Skeleton width={300} height={16} />
                </div>
                <Skeleton width={120} height={36} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton height={300} className="lg:col-span-2 rounded-xl" />
                <Skeleton height={300} className="rounded-xl" />
            </div>
        </div>
    )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="border rounded-xl">
            <div className="p-4 border-b bg-muted/50">
                <Skeleton width={200} height={20} />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="flex-1 space-y-1">
                        <Skeleton height={14} width="40%" />
                        <Skeleton height={12} width="60%" />
                    </div>
                    <Skeleton height={24} width={80} className="rounded-full" />
                </div>
            ))}
        </div>
    )
}
