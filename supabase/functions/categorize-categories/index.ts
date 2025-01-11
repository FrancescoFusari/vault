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

    const { categories } = await req.json();
    console.log('Categorizing categories:', categories);

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
            content: `You are a category organization assistant. Given a set of categories, group them into major life sections: private, work, interests, school, family, social, health, finance, memories.
            Return ONLY a valid JSON object where each key is one of these life sections and its value is an array of categories that belong to that section.
            Do not include any explanations or additional text, just the JSON object.
            Example format:
            {
              "work": ["meetings", "projects"],
              "health": ["exercise", "nutrition"],
              "social": ["friends", "events"]
            }`
          },
          {
            role: 'user',
            content: `Please categorize these categories: ${JSON.stringify(Object.keys(categories))}`
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

    let categorizedSections;
    try {
      const content = data.choices[0].message.content.trim();
      categorizedSections = JSON.parse(content);
      
      // Validate the response format
      if (typeof categorizedSections !== 'object' || Array.isArray(categorizedSections)) {
        throw new Error('Response is not an object');
      }
      
      // Validate that each value is an array
      for (const [key, value] of Object.entries(categorizedSections)) {
        if (!Array.isArray(value)) {
          throw new Error(`Section "${key}" value is not an array`);
        }
      }

      // Create a new categories object with the reorganized structure
      const reorganizedCategories: Record<string, string[]> = {};
      Object.entries(categorizedSections).forEach(([section, categoryNames]) => {
        categoryNames.forEach((categoryName) => {
          if (categories[categoryName]) {
            reorganizedCategories[`${section}: ${categoryName}`] = categories[categoryName];
          }
        });
      });

      return new Response(
        JSON.stringify(reorganizedCategories),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('Error in categorize-categories function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});