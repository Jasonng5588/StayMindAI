"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (resetError) throw resetError
            setSent(true)
        } catch {
            setError('Failed to send reset email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">S</div>
                        <span className="font-bold text-2xl gradient-text">StayMind AI</span>
                    </Link>
                </div>

                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">
                            {sent ? 'Check your email' : 'Reset password'}
                        </CardTitle>
                        <CardDescription>
                            {sent
                                ? `We've sent a reset link to ${email}`
                                : 'Enter your email and we\'ll send you a reset link'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Didn&apos;t receive the email?{' '}
                                    <button onClick={() => setSent(false)} className="text-primary hover:underline">Try again</button>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="email">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link<ArrowRight className="h-4 w-4 ml-2" /></>}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" /> Back to sign in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
