import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing URL:', url);

    // Fetch the content from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Basic HTML to text conversion
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Initialize OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Summarize the content using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize the main points of this webpage content in a clear and concise way. Focus on the key information and maintain the original meaning.'
          },
          {
            role: 'user',
            content: text.substring(0, 8000) // Limit content length
          }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Failed to summarize content');
    }

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content;

    // Add to processing queue
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] ?? '');
    if (!user) throw new Error('Not authenticated');

    const { data: queueItem, error: queueError } = await supabase
      .from('batch_processing_queue')
      .insert({
        user_id: user.id,
        content: summary,
        input_type: 'url',
        source_url: url,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (queueError) throw queueError;

    return new Response(
      JSON.stringify({ 
        message: 'URL processed successfully',
        queueItem 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing URL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});