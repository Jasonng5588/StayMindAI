import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

// ─── Browser-Side Auth Helpers ───

export async function signUp(email: string, password: string, fullName: string, role: UserRole = 'guest') {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role,
            },
        },
    })
    return { data, error }
}

export async function signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
}

export async function signInWithGoogle() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    })
    return { data, error }
}

export async function signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
}

export async function resetPassword(email: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
}

export async function updatePassword(newPassword: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
}

export async function getSession() {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
}

export async function getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
}

export async function getUserProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { profile: null, error: new Error('Not authenticated') }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return { profile, error }
}

export async function getUserRole(): Promise<UserRole | null> {
    const { profile } = await getUserProfile()
    return profile?.role ?? null
}

// ─── Server-Side Auth Helpers ───

export async function getServerSession() {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export async function getServerUser() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getServerUserProfile() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}

export async function requireAuth() {
    const user = await getServerUser()
    if (!user) {
        throw new Error('UNAUTHORIZED')
    }
    return user
}

export async function requireRole(allowedRoles: UserRole[]) {
    const profile = await getServerUserProfile()
    if (!profile || !allowedRoles.includes(profile.role)) {
        throw new Error('FORBIDDEN')
    }
    return profile
}

// ─── Tenant-Scoped Query Helpers ───

export async function getTenantClient(hotelId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('UNAUTHORIZED')

    // Verify user has access to this hotel
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('UNAUTHORIZED')

    // Super admins can access everything
    if (profile.role === 'super_admin') return supabase

    // Hotel owners: verify ownership
    if (profile.role === 'hotel_owner') {
        const { data: hotel } = await supabase
            .from('hotels')
            .select('id')
            .eq('id', hotelId)
            .eq('owner_id', user.id)
            .single()
        if (!hotel) throw new Error('FORBIDDEN')
        return supabase
    }

    // Staff: verify membership
    if (profile.role === 'staff') {
        const { data: membership } = await supabase
            .from('hotel_staff')
            .select('id')
            .eq('hotel_id', hotelId)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
        if (!membership) throw new Error('FORBIDDEN')
        return supabase
    }

    throw new Error('FORBIDDEN')
}
