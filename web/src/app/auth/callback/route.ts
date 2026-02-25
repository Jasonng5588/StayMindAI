import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Get user to check role
            const { data: { user } } = await supabase.auth.getUser()
            const role = user?.user_metadata?.role

            if (next) {
                return NextResponse.redirect(`${origin}${next}`)
            }

            // Route based on role
            if (role === 'guest') {
                return NextResponse.redirect(`${origin}/guest/dashboard`)
            }
            return NextResponse.redirect(`${origin}/dashboard`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
