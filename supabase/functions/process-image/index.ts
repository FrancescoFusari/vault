import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, filename, contentType } = await req.json();

    if (!image) {
      throw new Error('No image data provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(authHeader ?? '');
    if (!user) throw new Error('Not authenticated');

    // Convert base64 to Blob
    const base64Data = image.split(',')[1];
    const byteString = atob(base64Data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: contentType });

    // Upload file to storage
    const fileExt = filename.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('note_images')
      .upload(filePath, blob, {
        contentType,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('note_images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully, analyzing with OpenAI...');

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
        model: 'gpt-4-vision-preview',
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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image with OpenAI');
    }

    const analysisData = await response.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    console.log('OpenAI analysis complete:', analysis);

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