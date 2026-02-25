import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Get loyalty data for the current user (points, tier, rewards catalog)
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const hotel_id = searchParams.get('hotel_id')

        const admin = createAdminClient()

        // Get tiers (may not have hotel_id filter if none provided)
        let tiersQuery = admin.from('loyalty_tiers').select('*').order('min_points', { ascending: true })
        if (hotel_id) tiersQuery = tiersQuery.eq('hotel_id', hotel_id)
        const { data: tiers } = await tiersQuery

        // Get user's points history
        let pointsQuery = admin.from('loyalty_points').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        if (hotel_id) pointsQuery = pointsQuery.eq('hotel_id', hotel_id)
        const { data: pointsHistory } = await pointsQuery

        // Calculate current balance
        const total_points = pointsHistory?.reduce((sum, p) => sum + p.points, 0) || 0

        // Determine current tier
        const current_tier = tiers
            ?.filter(t => total_points >= t.min_points)
            .sort((a, b) => b.min_points - a.min_points)[0]?.name || 'Bronze'

        // Get rewards catalog
        let rewardsQuery = admin.from('loyalty_rewards').select('*').eq('is_active', true).order('points_cost', { ascending: true })
        if (hotel_id) rewardsQuery = rewardsQuery.eq('hotel_id', hotel_id)
        const { data: rewards } = await rewardsQuery

        return NextResponse.json({
            total_points,
            current_tier,
            tiers: tiers || [],
            rewards: rewards || [],
            history: pointsHistory || [],
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch loyalty data'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST: Redeem a reward
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { reward_id, hotel_id } = await request.json()
        if (!reward_id) {
            return NextResponse.json({ error: 'reward_id is required' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Get reward
        const { data: reward, error: rewardErr } = await admin
            .from('loyalty_rewards')
            .select('*')
            .eq('id', reward_id)
            .single()
        if (rewardErr || !reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })

        // Calculate current balance
        let historyQuery = admin.from('loyalty_points').select('points').eq('user_id', user.id)
        if (hotel_id) historyQuery = historyQuery.eq('hotel_id', hotel_id)
        const { data: history } = await historyQuery

        const balance = history?.reduce((sum, p) => sum + p.points, 0) || 0
        if (balance < reward.points_cost) {
            return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
        }

        // Deduct points
        const { data: redemption, error } = await admin
            .from('loyalty_points')
            .insert({
                user_id: user.id,
                hotel_id: hotel_id || reward.hotel_id || null,
                points: -reward.points_cost,
                balance_after: balance - reward.points_cost,
                type: 'redeemed',
                description: `Redeemed: ${reward.name}`,
                reward_id: reward.id,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ redemption, new_balance: balance - reward.points_cost }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to redeem reward'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

