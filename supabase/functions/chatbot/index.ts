// Supabase Edge Function: AI Customer Chatbot (Gemini-powered)
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

        const { hotel_id, message, conversation_history = [] } = await req.json()

        // Fetch hotel context
        const { data: hotel } = await supabase
            .from('hotels')
            .select('name, description, address, city, country, phone, email, check_in_time, check_out_time, star_rating')
            .eq('id', hotel_id)
            .single()

        const { data: roomTypes } = await supabase
            .from('room_types')
            .select('name, base_price, max_occupancy, amenities')
            .eq('hotel_id', hotel_id)

        const { data: services } = await supabase
            .from('services_addons')
            .select('name, description, price, category')
            .eq('hotel_id', hotel_id)
            .eq('is_active', true)

        // Build system prompt with hotel context
        const systemPrompt = `You are a helpful, friendly AI concierge for ${hotel?.name ?? 'our hotel'}. Answer guest questions accurately based on this information:

HOTEL INFO:
- Name: ${hotel?.name}
- Rating: ${hotel?.star_rating ?? 'N/A'} stars
- Address: ${hotel?.address}, ${hotel?.city}, ${hotel?.country}
- Phone: ${hotel?.phone}
- Email: ${hotel?.email}
- Check-in: ${hotel?.check_in_time ?? '3:00 PM'}
- Check-out: ${hotel?.check_out_time ?? '11:00 AM'}
- Description: ${hotel?.description ?? 'A premium hotel experience'}

ROOM TYPES:
${(roomTypes ?? []).map(r => `- ${r.name}: $${r.base_price}/night, max ${r.max_occupancy} guests, amenities: ${r.amenities?.join(', ') ?? 'Standard amenities'}`).join('\n')}

SERVICES:
${(services ?? []).map(s => `- ${s.name} (${s.category}): $${s.price} - ${s.description}`).join('\n')}

RULES:
- Be concise and helpful (max 150 words)
- If you don't know something, say so politely and suggest contacting the front desk
- For booking requests, guide them to the booking page
- Never make up information not provided above
- Be warm and professional`

        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) {
            return new Response(JSON.stringify({
                reply: `Thank you for reaching out! I'd be happy to help. For detailed inquiries, please contact us at ${hotel?.email ?? 'the front desk'}. Our check-in time is ${hotel?.check_in_time ?? '3:00 PM'} and check-out is ${hotel?.check_out_time ?? '11:00 AM'}.`,
                source: 'fallback'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Build conversation for Gemini
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'I understand. I\'m ready to help guests with questions about the hotel.' }] },
            ...conversation_history.map((msg: { role: string; text: string }) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ]

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                    topP: 0.9,
                }
            })
        })

        const data = await res.json()
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I apologize, I\'m having trouble responding right now. Please try again or contact the front desk.'

        // Log usage
        await supabase.from('ai_logs').insert({
            hotel_id,
            function_name: 'chatbot',
            input: { message },
            output: { reply: reply.substring(0, 200) },
            tokens_used: data?.usageMetadata?.totalTokenCount ?? 200,
        }).catch(() => { })

        return new Response(JSON.stringify({ reply, source: 'gemini' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal chatbot error'
        return new Response(JSON.stringify({ error: message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
