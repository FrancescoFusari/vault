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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, noteId, type } = await req.json();
    console.log(`Regenerating ${type} for note:`, noteId);
    console.log('Content:', content);

    // First, generate analysis using OpenAI
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
            content: type === 'tags' 
              ? 'Generate 3-5 relevant tags for the following note. Return only a JSON array of strings, nothing else. Example: ["tag1", "tag2", "tag3"]'
              : 'Generate a concise, descriptive title (2-5 words) for the following note. Return only the title as a string, nothing else.'
          },
          {
            role: 'user',
            content
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      console.error('OpenAI API error:', await analysisResponse.text());
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('OpenAI response:', analysisData);
    
    const generatedContent = analysisData.choices[0]?.message?.content;
    console.log('Generated content:', generatedContent);
    
    let parsedContent;
    if (type === 'tags') {
      try {
        // For tags, try to parse as JSON array
        parsedContent = JSON.parse(generatedContent);
        if (!Array.isArray(parsedContent)) {
          throw new Error('Tags must be an array');
        }
      } catch (error) {
        console.error('Failed to parse tags:', error);
        // Fallback: split by commas and clean up
        parsedContent = generatedContent
          .replace(/[\[\]"]/g, '') // Remove brackets and quotes
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    } else {
      // For title/category, use as is
      parsedContent = generatedContent.trim();
    }

    console.log('Parsed content:', parsedContent);

    // Update the note in Supabase
    const updateData = type === 'tags' 
      ? { tags: parsedContent }
      : { category: parsedContent };

    const { data: updatedNote, error: updateError } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify(updatedNote),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in regenerate-note-metadata function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});