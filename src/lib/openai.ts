const SYSTEM_PROMPT = `You are a helpful assistant that analyzes notes and provides:
1. A single category from: Personal, Work, Study, Health, Finance, or Other
2. Up to 3 relevant tags that describe the main topics or themes
Return only a JSON object with "category" and "tags" fields.`;

export async function analyzeNote(content: string, apiKey: string) {
  console.log('Analyzing note:', content);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze note');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const result = JSON.parse(data.choices[0].message.content);
    return {
      category: result.category,
      tags: result.tags,
    };
  } catch (error) {
    console.error('Error analyzing note:', error);
    throw error;
  }
}