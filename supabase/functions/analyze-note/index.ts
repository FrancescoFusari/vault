import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

serve(async (req) => {
  try {
    const { content } = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const configuration = new Configuration({ apiKey })
    const openai = new OpenAIApi(configuration)

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes notes and extracts relevant tags. Respond only with JSON in the format: {\"category\": \"string\", \"tags\": [\"string\"]}"
        },
        {
          role: "user",
          content: content
        }
      ]
    })

    const result = completion.data.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      result,
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})