import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using service_role key.
 * Bypasses RLS – use ONLY in server-side API routes, never on the client.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set – falling back to anon key (RLS will apply)')
        return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
