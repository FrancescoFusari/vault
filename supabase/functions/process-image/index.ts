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
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      throw new Error('No file uploaded');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(authHeader ?? '');
    if (!user) throw new Error('Not authenticated');

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('note_images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('note_images')
      .getPublicUrl(filePath);

    // Analyze image with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an AI that analyzes images and provides detailed descriptions with relevant tags and categories. Respond with a JSON object containing: description (string), tags (array of strings), and category (string).'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image and provide a description, relevant tags, and a category.' },
              { type: 'image_url', image_url: publicUrl }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image with OpenAI');
    }

    const analysisData = await response.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    // Create note with image analysis
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content: analysis.description,
        category: analysis.category,
        tags: analysis.tags,
        input_type: 'image',
        source_image_path: filePath
      })
      .select()
      .single();

    if (noteError) throw noteError;

    return new Response(
      JSON.stringify({ success: true, note }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});