// Supabase Edge Function: Review Sentiment Analysis
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

        const { hotel_id, review_id, review_text, rating } = await req.json()

        const geminiKey = Deno.env.get('GEMINI_API_KEY')

        // Fallback: rule-based sentiment if no API key
        if (!geminiKey) {
            const sentiment = rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative'
            const keywords = review_text.toLowerCase()
            const topics: string[] = []
            if (keywords.includes('clean') || keywords.includes('room')) topics.push('Cleanliness')
            if (keywords.includes('staff') || keywords.includes('service')) topics.push('Service')
            if (keywords.includes('food') || keywords.includes('breakfast')) topics.push('Food')
            if (keywords.includes('location') || keywords.includes('view')) topics.push('Location')
            if (keywords.includes('price') || keywords.includes('value')) topics.push('Value')

            return new Response(JSON.stringify({
                sentiment,
                score: rating / 5,
                topics: topics.length ? topics : ['General'],
                summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} review (${rating}/5 stars)`,
                suggested_response: null,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const prompt = `Analyze this hotel review and respond in JSON format only:
Review (${rating}/5 stars): "${review_text}"

Respond with this exact JSON structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0.0-1.0,
  "topics": ["topic1", "topic2"],
  "key_positives": ["point1"],
  "key_negatives": ["point1"],
  "summary": "One sentence summary",
  "suggested_response": "Professional response to this review"
}`

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
            })
        })

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

        // Parse JSON from response (handle markdown code blocks)
        let analysis
        try {
            const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            analysis = JSON.parse(jsonStr)
        } catch {
            analysis = {
                sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
                score: rating / 5,
                topics: ['General'],
                summary: text.substring(0, 200),
                suggested_response: null
            }
        }

        // Update review with sentiment data if review_id provided
        if (review_id) {
            await supabase
                .from('reviews')
                .update({
                    sentiment: analysis.sentiment,
                    ai_summary: analysis.summary,
                })
                .eq('id', review_id)
                .catch(() => { })
        }

        await supabase.from('ai_logs').insert({
            hotel_id,
            function_name: 'sentiment-analysis',
            input: { review_id, rating },
            output: { sentiment: analysis.sentiment, score: analysis.score },
            tokens_used: data?.usageMetadata?.totalTokenCount ?? 150,
        }).catch(() => { })

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
