// Supabase Edge Function: Dynamic Pricing Engine
// Deploy: supabase functions deploy dynamic-pricing

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PricingRequest {
    hotel_id: string
    room_type_id: string
    check_in: string
    check_out: string
}

interface PricingResponse {
    base_price: number
    suggested_price: number
    adjustment_pct: number
    factors: { name: string; impact: number; description: string }[]
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { hotel_id, room_type_id, check_in, check_out }: PricingRequest = await req.json()

        // Get room type base price
        const { data: roomType } = await supabase
            .from('room_types')
            .select('base_price, name')
            .eq('id', room_type_id)
            .single()

        if (!roomType) {
            return new Response(JSON.stringify({ error: 'Room type not found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const basePrice = roomType.base_price
        const checkInDate = new Date(check_in)
        const checkOutDate = new Date(check_out)
        const factors: PricingResponse['factors'] = []

        // Factor 1: Occupancy rate
        const { count: totalRooms } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel_id)
            .eq('room_type_id', room_type_id)

        const { count: bookedRooms } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel_id)
            .lte('check_in', check_out)
            .gte('check_out', check_in)
            .in('status', ['confirmed', 'checked_in'])

        const occupancyRate = totalRooms ? (bookedRooms ?? 0) / totalRooms : 0
        let occupancyAdjust = 0
        if (occupancyRate > 0.9) occupancyAdjust = 0.25
        else if (occupancyRate > 0.75) occupancyAdjust = 0.15
        else if (occupancyRate > 0.5) occupancyAdjust = 0.05
        else if (occupancyRate < 0.3) occupancyAdjust = -0.15
        else if (occupancyRate < 0.5) occupancyAdjust = -0.05

        factors.push({ name: 'Occupancy', impact: occupancyAdjust, description: `Current occupancy: ${Math.round(occupancyRate * 100)}%` })

        // Factor 2: Day of week (weekends premium)
        const dayOfWeek = checkInDate.getDay()
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
        const dayAdjust = isWeekend ? 0.1 : -0.05
        factors.push({ name: 'Day of Week', impact: dayAdjust, description: isWeekend ? 'Weekend premium' : 'Weekday discount' })

        // Factor 3: Seasonality
        const month = checkInDate.getMonth()
        let seasonAdjust = 0
        if (month >= 5 && month <= 7) seasonAdjust = 0.2 // Summer peak
        else if (month === 11 || month === 0) seasonAdjust = 0.15 // Holiday season
        else if (month >= 1 && month <= 3) seasonAdjust = -0.1 // Winter off-peak
        factors.push({ name: 'Season', impact: seasonAdjust, description: seasonAdjust > 0 ? 'Peak season' : seasonAdjust < 0 ? 'Off-peak season' : 'Regular season' })

        // Factor 4: Advance booking
        const daysUntil = Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        let advanceAdjust = 0
        if (daysUntil < 2) advanceAdjust = 0.15 // Last minute premium
        else if (daysUntil > 30) advanceAdjust = -0.05 // Early bird discount
        factors.push({ name: 'Advance Booking', impact: advanceAdjust, description: daysUntil < 2 ? 'Last-minute booking' : daysUntil > 30 ? 'Early bird discount' : 'Standard timing' })

        // Calculate total adjustment
        const totalAdjustment = factors.reduce((sum, f) => sum + f.impact, 0)
        const suggestedPrice = Math.round(basePrice * (1 + totalAdjustment) * 100) / 100

        // Use Gemini for additional context (if API key available)
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        let aiInsight = ''
        if (geminiKey) {
            try {
                const prompt = `Given a hotel room (${roomType.name}) with base price $${basePrice}, current occupancy ${Math.round(occupancyRate * 100)}%, ${isWeekend ? 'weekend' : 'weekday'}, in month ${month + 1}, and ${daysUntil} days until check-in: Suggest optimal pricing in one sentence.`
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                })
                const data = await res.json()
                aiInsight = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            } catch {
                // AI insight is optional; continue without it
            }
        }

        const response: PricingResponse & { ai_insight?: string } = {
            base_price: basePrice,
            suggested_price: suggestedPrice,
            adjustment_pct: Math.round(totalAdjustment * 100),
            factors,
            ...(aiInsight && { ai_insight: aiInsight }),
        }

        // Log the pricing calculation
        await supabase.from('ai_logs').insert({
            hotel_id,
            function_name: 'dynamic-pricing',
            input: { hotel_id, room_type_id, check_in, check_out },
            output: response,
            tokens_used: aiInsight ? 150 : 0,
        }).catch(() => { }) // Non-blocking

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
