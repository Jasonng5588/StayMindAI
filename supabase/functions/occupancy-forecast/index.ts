// Supabase Edge Function: Occupancy Forecast (30-day prediction)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { hotel_id } = await req.json()

        // Get total rooms
        const { count: totalRooms } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel_id)

        if (!totalRooms) {
            return new Response(JSON.stringify({ error: 'No rooms found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Get historical booking data (last 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data: historicalBookings } = await supabase
            .from('bookings')
            .select('check_in, check_out')
            .eq('hotel_id', hotel_id)
            .gte('check_in', ninetyDaysAgo)
            .in('status', ['confirmed', 'checked_in', 'checked_out'])

        // Build daily occupancy map from history
        const dailyHistory: Record<string, number> = {}
            ; (historicalBookings ?? []).forEach(b => {
                const start = new Date(b.check_in)
                const end = new Date(b.check_out)
                for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                    const key = d.toISOString().split('T')[0]
                    dailyHistory[key] = (dailyHistory[key] || 0) + 1
                }
            })

        // Calculate day-of-week averages
        const dowAvg: number[] = Array(7).fill(0)
        const dowCount: number[] = Array(7).fill(0)
        Object.entries(dailyHistory).forEach(([date, count]) => {
            const dow = new Date(date).getDay()
            dowAvg[dow] += count / totalRooms
            dowCount[dow] += 1
        })
        for (let i = 0; i < 7; i++) {
            dowAvg[i] = dowCount[i] > 0 ? dowAvg[i] / dowCount[i] : 0.5
        }

        // Get confirmed future bookings
        const today = new Date().toISOString().split('T')[0]
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data: futureBookings } = await supabase
            .from('bookings')
            .select('check_in, check_out')
            .eq('hotel_id', hotel_id)
            .lte('check_in', thirtyDays)
            .gte('check_out', today)
            .in('status', ['confirmed', 'checked_in'])

        // Count confirmed bookings per day
        const confirmedPerDay: Record<string, number> = {}
            ; (futureBookings ?? []).forEach(b => {
                const start = new Date(b.check_in)
                const end = new Date(b.check_out)
                for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                    const key = d.toISOString().split('T')[0]
                    confirmedPerDay[key] = (confirmedPerDay[key] || 0) + 1
                }
            })

        // Generate 30-day forecast
        const forecast = []
        for (let i = 0; i < 30; i++) {
            const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
            const dateStr = date.toISOString().split('T')[0]
            const dow = date.getDay()
            const confirmed = confirmedPerDay[dateStr] || 0
            const historicalRate = dowAvg[dow]

            // Blend confirmed bookings with historical pattern
            const confirmedRate = confirmed / totalRooms
            const predictedRate = Math.min(1, Math.max(0, confirmedRate + historicalRate * (1 - confirmedRate) * 0.5))

            forecast.push({
                date: dateStr,
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow],
                confirmed_rooms: confirmed,
                predicted_occupancy: Math.round(predictedRate * 100),
                predicted_rooms: Math.round(predictedRate * totalRooms),
                total_rooms: totalRooms,
                confidence: confirmed > 0 ? 'high' : historicalRate > 0 ? 'medium' : 'low',
            })
        }

        // AI-enhanced insight
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        let insight = ''
        if (geminiKey) {
            try {
                const avgOccupancy = Math.round(forecast.reduce((s, f) => s + f.predicted_occupancy, 0) / 30)
                const prompt = `Hotel with ${totalRooms} rooms. 30-day avg predicted occupancy: ${avgOccupancy}%. Peak days: ${forecast.filter(f => f.predicted_occupancy > 80).length}. Low days: ${forecast.filter(f => f.predicted_occupancy < 40).length}. Give 2 actionable recommendations in under 50 words.`
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                })
                const data = await res.json()
                insight = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            } catch { }
        }

        const response = {
            hotel_id,
            total_rooms: totalRooms,
            forecast,
            summary: {
                avg_occupancy: Math.round(forecast.reduce((s, f) => s + f.predicted_occupancy, 0) / 30),
                peak_days: forecast.filter(f => f.predicted_occupancy > 80).length,
                low_days: forecast.filter(f => f.predicted_occupancy < 40).length,
                predicted_revenue_impact: forecast.filter(f => f.predicted_occupancy < 40).length > 10 ? 'Consider promotions' : 'On track',
            },
            ...(insight && { ai_insight: insight }),
        }

        await supabase.from('ai_logs').insert({
            hotel_id,
            function_name: 'occupancy-forecast',
            input: { hotel_id },
            output: { summary: response.summary },
            tokens_used: insight ? 100 : 0,
        }).catch(() => { })

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
