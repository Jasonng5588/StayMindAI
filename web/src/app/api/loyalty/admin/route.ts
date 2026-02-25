import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Admin – list all loyalty members, tiers, rewards for a hotel
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const hotel_id = searchParams.get('hotel_id')
        const section = searchParams.get('section') || 'all'

        const admin = createAdminClient()
        const result: Record<string, unknown> = {}

        // If no hotel_id, auto-resolve
        let resolvedHotelId = hotel_id
        if (!resolvedHotelId) {
            const { data: hotels } = await admin.from('hotels').select('id').eq('is_active', true).limit(1)
            resolvedHotelId = hotels?.[0]?.id || null
        }

        if (section === 'all' || section === 'tiers') {
            let tiersQuery = admin.from('loyalty_tiers').select('*').order('sort_order', { ascending: true })
            if (resolvedHotelId) tiersQuery = tiersQuery.eq('hotel_id', resolvedHotelId)
            const { data: tiers } = await tiersQuery
            result.tiers = tiers || []
        }

        if (section === 'all' || section === 'rewards') {
            let rewardsQuery = admin.from('loyalty_rewards').select('*').order('points_cost', { ascending: true })
            if (resolvedHotelId) rewardsQuery = rewardsQuery.eq('hotel_id', resolvedHotelId)
            const { data: rewards } = await rewardsQuery
            result.rewards = rewards || []
        }

        if (section === 'all' || section === 'members') {
            let pointsQuery = admin.from('loyalty_points').select('user_id, points, profiles(full_name, email)')
            if (resolvedHotelId) pointsQuery = pointsQuery.eq('hotel_id', resolvedHotelId)
            const { data: points } = await pointsQuery

            // Aggregate per user
            const memberMap = new Map<string, { user_id: string; full_name: string; email: string; total_points: number }>()
            points?.forEach((p: Record<string, unknown>) => {
                const profile = p.profiles as unknown as { full_name: string; email: string }
                const existing = memberMap.get(p.user_id as string)
                if (existing) {
                    existing.total_points += p.points as number
                } else {
                    memberMap.set(p.user_id as string, {
                        user_id: p.user_id as string,
                        full_name: profile?.full_name || 'Unknown',
                        email: profile?.email || '',
                        total_points: p.points as number,
                    })
                }
            })
            result.members = Array.from(memberMap.values())
        }

        return NextResponse.json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch loyalty admin data'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST: Admin – create tier / reward / adjust points
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, hotel_id, ...payload } = body

        if (!action) {
            return NextResponse.json({ error: 'action is required' }, { status: 400 })
        }

        const admin = createAdminClient()
        let result

        // Auto-resolve hotel_id if not provided
        let resolvedHotelId = hotel_id
        if (!resolvedHotelId) {
            const { data: hotels } = await admin.from('hotels').select('id').eq('is_active', true).limit(1)
            resolvedHotelId = hotels?.[0]?.id || null
            if (!resolvedHotelId) {
                return NextResponse.json({ error: 'No hotel found. Please create a hotel first.' }, { status: 400 })
            }
        }

        if (action === 'create_tier') {
            const { data, error } = await admin
                .from('loyalty_tiers')
                .insert({ hotel_id: resolvedHotelId, ...payload })
                .select()
                .single()
            if (error) throw error
            result = data
        } else if (action === 'update_tier') {
            const { tier_id, ...rest } = payload
            const { data, error } = await admin
                .from('loyalty_tiers')
                .update(rest)
                .eq('id', tier_id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else if (action === 'create_reward') {
            const { data, error } = await admin
                .from('loyalty_rewards')
                .insert({ hotel_id: resolvedHotelId, ...payload })
                .select()
                .single()
            if (error) throw error
            result = data
        } else if (action === 'update_reward') {
            const { reward_id, ...rest } = payload
            const { data, error } = await admin
                .from('loyalty_rewards')
                .update(rest)
                .eq('id', reward_id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else if (action === 'delete_reward') {
            const { error } = await admin
                .from('loyalty_rewards')
                .delete()
                .eq('id', payload.reward_id)
            if (error) throw error
            result = { deleted: true }
        } else if (action === 'adjust_points') {
            const { user_id: target_user, points, description, type = 'adjusted' } = payload

            // Get current balance
            const { data: history } = await admin
                .from('loyalty_points')
                .select('points')
                .eq('user_id', target_user)

            const balance = history?.reduce((sum: number, p: { points: number }) => sum + p.points, 0) || 0
            const { data, error } = await admin
                .from('loyalty_points')
                .insert({
                    user_id: target_user,
                    hotel_id: resolvedHotelId,
                    points,
                    balance_after: balance + points,
                    type,
                    description: description || 'Admin adjustment',
                })
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
        }

        return NextResponse.json({ result }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to perform loyalty admin action'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
