import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const openAiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { emailId } = await req.json();
    
    if (!emailId) {
      throw new Error('Email ID is required');
    }

    // Fetch email details from the queue
    const { data: emailData, error: emailError } = await supabase
      .from('email_processing_queue')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !emailData) {
      throw new Error('Failed to fetch email data');
    }

    // Process email content with OpenAI
    const prompt = `
      Analyze this email and extract key information:
      
      Subject: ${emailData.subject}
      From: ${emailData.sender}
      Content: ${emailData.email_body}
      
      Provide a JSON response with:
      1. tags: Array of relevant tags/keywords
      2. category: Main category or topic
      3. metadata: Object containing:
         - key_points: Array of main points
         - action_items: Array of action items
         - important_dates: Array of any mentioned dates
    `;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes emails and extracts structured information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      })
    });

    if (!openAiResponse.ok) {
      console.error('OpenAI API error:', await openAiResponse.text());
      throw new Error('Failed to process with OpenAI');
    }

    const openAiData = await openAiResponse.json();
    
    if (!openAiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response format');
    }

    const content = openAiData.choices[0].message.content;
    console.log('OpenAI response:', content);

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Basic validation of the analysis structure
    if (!analysis || !Array.isArray(analysis.tags) || typeof analysis.category !== 'string' || !analysis.metadata) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Invalid response structure from OpenAI');
    }

    // Create note from processed email
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: emailData.user_id,
        content: `
          From: ${emailData.sender}
          Subject: ${emailData.subject}
          
          ${emailData.email_body}
        `,
        category: analysis.category,
        tags: analysis.tags,
        input_type: 'email',
        metadata: analysis.metadata
      })
      .select()
      .single();

    if (noteError) {
      throw new Error('Failed to create note');
    }

    // Update email processing status
    const { error: updateError } = await supabase
      .from('email_processing_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (updateError) {
      console.error('Failed to update email status:', updateError);
    }

    return new Response(
      JSON.stringify({ note }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});