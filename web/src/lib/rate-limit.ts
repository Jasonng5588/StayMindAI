import { NextResponse } from 'next/server'

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
    windowMs: number
    maxRequests: number
}

export function rateLimit(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    return function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
        const now = Date.now()
        const entry = rateLimitStore.get(identifier)

        if (!entry || now > entry.resetTime) {
            rateLimitStore.set(identifier, { count: 1, resetTime: now + config.windowMs })
            return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
        }

        entry.count++
        const remaining = Math.max(0, config.maxRequests - entry.count)

        if (entry.count > config.maxRequests) {
            return { allowed: false, remaining: 0, resetIn: entry.resetTime - now }
        }

        return { allowed: true, remaining, resetIn: entry.resetTime - now }
    }
}

// Pre-configured limiters
export const apiLimiter = rateLimit({ windowMs: 60000, maxRequests: 100 })
export const authLimiter = rateLimit({ windowMs: 3600000, maxRequests: 10 })
export const aiLimiter = rateLimit({ windowMs: 86400000, maxRequests: 500 })

// Helper to apply rate limiting in API routes
export function withRateLimit(
    ip: string,
    limiter: ReturnType<typeof rateLimit> = apiLimiter
) {
    const result = limiter(ip)
    if (!result.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
                    'Retry-After': String(Math.ceil(result.resetIn / 1000)),
                },
            }
        )
    }
    return null // No rate limit hit
}

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of rateLimitStore) {
            if (now > entry.resetTime) rateLimitStore.delete(key)
        }
    }, 300000)
}
