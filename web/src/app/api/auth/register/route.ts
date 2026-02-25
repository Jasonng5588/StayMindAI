import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const { email, password, full_name } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1) Try to create user via admin API
        let userId: string | null = null

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role: 'guest' },
        })

        if (authError) {
            // If user already exists, try to look them up
            if (authError.message.includes('already') || authError.message.includes('exists') || authError.message.includes('duplicate')) {
                // User exists from a previous failed attempt - look them up
                const { data: users } = await supabase.auth.admin.listUsers()
                const existingUser = users?.users?.find(u => u.email === email)
                if (existingUser) {
                    userId = existingUser.id
                    // Update their password to the new one
                    await supabase.auth.admin.updateUserById(existingUser.id, { password })
                } else {
                    return NextResponse.json({ error: authError.message }, { status: 400 })
                }
            } else {
                return NextResponse.json({ error: authError.message }, { status: 400 })
            }
        } else {
            userId = authData.user?.id || null
        }

        if (!userId) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // 2) Ensure profile row exists (upsert bypasses any trigger issues)
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: email,
            full_name: full_name || email.split('@')[0],
            role: 'guest',
            is_active: true,
        }, { onConflict: 'id' })

        if (profileError) {
            console.error('Profile upsert error:', profileError)
            // Don't fail registration if profile creation fails - user can still log in
        }

        return NextResponse.json({
            user: { id: userId, email },
            message: 'Account created successfully',
        })
    } catch (err) {
        console.error('Registration error:', err)
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
}
