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
    console.log('Processing email to note:', { emailId, userId });

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

    // Analyze content with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Analyzing email content with OpenAI...');
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
            content: `Analyze the following email and provide:
            1. A category that best describes the content
            2. Relevant tags (including the subject as first tag)
            3. Any key metadata or insights
            
            Respond with a JSON object containing:
            {
              "category": "string",
              "tags": ["string"],
              "metadata": {
                "email_subject": "string",
                "sender": "string",
                "analysis_notes": "string"
              }
            }`
          },
          {
            role: 'user',
            content: `Subject: ${email.subject}\nFrom: ${email.sender}\n\nContent:\n${email.email_body}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!analysisResponse.ok) {
      console.error('OpenAI API error:', await analysisResponse.text());
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('OpenAI analysis response:', analysisData);

    let analysis;
    try {
      analysis = JSON.parse(analysisData.choices[0].message.content);
      console.log('Parsed analysis:', analysis);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw content:', analysisData.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }

    // Create note
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .insert({
        user_id: userId,
        content: email.email_body,
        category: analysis.category,
        tags: analysis.tags,
        input_type: 'email',
        metadata: {
          email_subject: email.subject,
          sender: email.sender,
          received_at: email.received_at,
          analysis_notes: analysis.metadata.analysis_notes
        }
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
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (updateError) {
      console.error('Error updating email status:', updateError);
      // Don't throw here as the note was created successfully
    }

    console.log('Successfully processed email to note:', note);
    return new Response(
      JSON.stringify({ success: true, note }),
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