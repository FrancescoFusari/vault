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
    const { imagePath, userId } = await req.json();
    console.log('Processing image:', imagePath);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get image URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('note_images')
      .getPublicUrl(imagePath);

    // Analyze image with OpenAI Vision
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze the image and provide:
            1. A detailed description
            2. Relevant tags
            3. Technical details and visual elements

            Return a JSON object in this exact format:
            {
              "description": "string",
              "tags": ["string"],
              "metadata": {
                "technical_details": "string",
                "visual_elements": ["string"],
                "color_palette": ["string"],
                "composition_notes": "string",
                "estimated_date_or_period": "string"
              }
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: publicUrl
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    if (!analysisResponse.ok) {
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
      throw new Error('Invalid response format from OpenAI');
    }

    // Create note
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .insert({
        user_id: userId,
        content: analysis.description,
        category: 'Image Note',
        tags: analysis.tags,
        input_type: 'image',
        source_image_path: imagePath,
        metadata: analysis.metadata
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw noteError;
    }

    return new Response(
      JSON.stringify(note),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});