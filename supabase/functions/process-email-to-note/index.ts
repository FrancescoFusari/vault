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
    const { emailId, userId } = await req.json();
    console.log('Processing email:', { emailId, userId });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch email details
    const { data: email, error: emailError } = await supabaseClient
      .from('email_processing_queue')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      console.error('Error fetching email:', emailError);
      throw new Error('Email not found');
    }

    console.log('Email fetched:', email);

    // Analyze content with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Analyze the email content and provide:
            1. Relevant tags (including the subject as first tag)
            2. Any key metadata or insights

            Return a JSON object in this exact format:
            {
              "tags": ["string"],
              "metadata": {
                "key_points": ["string"],
                "action_items": ["string"],
                "important_dates": ["string"]
              }
            }`
          },
          {
            role: 'user',
            content: `Subject: ${email.subject}\nFrom: ${email.sender}\n\nContent:\n${email.email_body || 'No content available'}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!analysisResponse.ok) {
      console.error('OpenAI API error:', await analysisResponse.text());
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('OpenAI analysis response:', analysisData);

    if (!analysisData.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', analysisData);
      throw new Error('Unexpected response format from OpenAI');
    }

    let analysis;
    try {
      const content = analysisData.choices[0].message.content.trim();
      analysis = JSON.parse(content);
      
      // Validate the response format
      if (!Array.isArray(analysis.tags) || !analysis.metadata || 
          !Array.isArray(analysis.metadata.key_points) || 
          !Array.isArray(analysis.metadata.action_items) || 
          !Array.isArray(analysis.metadata.important_dates)) {
        throw new Error('Invalid response structure');
      }
      
      console.log('Parsed analysis:', analysis);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    // Create note
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .insert({
        user_id: userId,
        content: email.email_body || 'No content available',
        category: 'Email Note',
        tags: analysis.tags,
        input_type: 'email',
        metadata: analysis.metadata
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw noteError;
    }

    // Update email status
    const { error: updateError } = await supabaseClient
      .from('email_processing_queue')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (updateError) {
      console.error('Error updating email status:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ note }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-email-to-note function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});