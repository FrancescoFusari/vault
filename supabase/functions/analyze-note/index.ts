import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { content } = await req.json();
    console.log('Analyzing note content:', content);

    // First, generate a title
    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Generate a short, concise title (maximum 5 words) for the following note. Respond with just the title, nothing else.'
          },
          {
            role: 'user',
            content
          }
        ],
      }),
    });

    if (!titleResponse.ok) {
      throw new Error(`OpenAI API error: ${titleResponse.statusText}`);
    }

    const titleData = await titleResponse.json();
    const generatedTitle = titleData.choices[0]?.message?.content.trim();
    console.log('Generated title:', generatedTitle);

    // Then, analyze for category and tags
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
            content: 'Analyze the following note and provide a category and relevant tags. Respond with a JSON object containing "category" (string) and "tags" (array of strings). Do not include any markdown formatting or code blocks in your response.'
          },
          {
            role: 'user',
            content
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('Raw OpenAI response:', analysisData);

    const analysisContent = analysisData.choices[0]?.message?.content;
    console.log('Analysis content:', analysisContent);

    // Parse the response content as JSON
    let result;
    try {
      result = JSON.parse(analysisContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    // Add the generated title as the first tag
    result.tags = [generatedTitle, ...result.tags];
    console.log('Final analysis result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-note function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});