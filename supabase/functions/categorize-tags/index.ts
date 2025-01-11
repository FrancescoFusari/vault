import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { tags } = await req.json();
    console.log('Categorizing tags:', tags);

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
            content: `You are a tag categorization assistant. Given a list of tags, group them into 3-5 broad categories.
            Return ONLY a valid JSON object where each key is a category and its value is an array of tags that belong to that category.
            Do not include any explanations or additional text, just the JSON object.
            Example format:
            {
              "Work": ["meeting", "project", "deadline"],
              "Personal": ["family", "health", "hobby"],
              "Learning": ["study", "course", "tutorial"]
            }`
          },
          {
            role: 'user',
            content: `Please categorize these tags: ${JSON.stringify(tags)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Unexpected response format from OpenAI');
    }

    let categories;
    try {
      const content = data.choices[0].message.content.trim();
      categories = JSON.parse(content);
      
      // Validate the response format
      if (typeof categories !== 'object' || Array.isArray(categories)) {
        throw new Error('Response is not an object');
      }
      
      // Validate that each value is an array
      for (const [key, value] of Object.entries(categories)) {
        if (!Array.isArray(value)) {
          throw new Error(`Category "${key}" value is not an array`);
        }
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }

    return new Response(
      JSON.stringify(categories),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in categorize-tags function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});