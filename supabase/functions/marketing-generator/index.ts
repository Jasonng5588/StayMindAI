// Supabase Edge Function: Marketing Content Generator
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

        const { hotel_id, content_type, target_audience, tone, promo_code } = await req.json()

        // Fetch hotel details
        const { data: hotel } = await supabase
            .from('hotels')
            .select('name, description, city, country, star_rating')
            .eq('id', hotel_id)
            .single()

        const { data: roomTypes } = await supabase
            .from('room_types')
            .select('name, base_price')
            .eq('hotel_id', hotel_id)
            .order('base_price', { ascending: true })
            .limit(3)

        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) {
            return new Response(JSON.stringify({
                content: `Experience luxury at ${hotel?.name ?? 'our hotel'}! Book now and enjoy world-class hospitality${promo_code ? ` with code ${promo_code}` : ''}.`,
                source: 'template'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const contentTypes: Record<string, string> = {
            'social_post': 'a social media post (Instagram/Facebook) with hashtags, max 280 characters',
            'email_subject': '5 email subject line options for a marketing email',
            'email_body': 'a marketing email body (HTML format with inline styles)',
            'ad_copy': 'Google/Facebook ad copy with headline and description',
            'blog_intro': 'an engaging blog post introduction paragraph',
            'sms': 'a promotional SMS message under 160 characters',
        }

        const prompt = `Create ${contentTypes[content_type] ?? 'marketing content'} for this hotel:

Hotel: ${hotel?.name} (${hotel?.star_rating ?? 4}★)
Location: ${hotel?.city}, ${hotel?.country}
Description: ${hotel?.description ?? 'A premium hotel'}
Room prices from: $${roomTypes?.[0]?.base_price ?? 99}/night
${promo_code ? `Promo code: ${promo_code}` : ''}
Target audience: ${target_audience ?? 'Leisure travelers'}
Tone: ${tone ?? 'Professional and inviting'}

Make it compelling and action-oriented. Include a call-to-action.`

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
            })
        })

        const data = await res.json()
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

        await supabase.from('ai_logs').insert({
            hotel_id,
            function_name: 'marketing-generator',
            input: { content_type, target_audience, tone },
            output: { content: content.substring(0, 200) },
            tokens_used: data?.usageMetadata?.totalTokenCount ?? 200,
        }).catch(() => { })

        return new Response(JSON.stringify({ content, content_type, source: 'gemini' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
