import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get Gmail tokens
    const { data: integration, error: integrationError } = await supabase
      .from('gmail_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      throw new Error('Gmail not connected');
    }

    // Fetch emails using Gmail API
    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const { messages } = await response.json();
    const emails = await Promise.all(
      messages.map(async ({ id }: { id: string }) => {
        const emailResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${id}`,
          {
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
            },
          }
        );
        return emailResponse.json();
      })
    );

    // Process emails and add to queue
    const emailsToQueue = emails.map((email: any) => ({
      user_id: user.id,
      email_id: email.id,
      sender: email.payload.headers.find((h: any) => h.name === 'From').value,
      subject: email.payload.headers.find((h: any) => h.name === 'Subject').value,
      received_at: new Date(parseInt(email.internalDate)).toISOString(),
    }));

    const { error: queueError } = await supabase
      .from('email_processing_queue')
      .upsert(emailsToQueue);

    if (queueError) {
      throw queueError;
    }

    return new Response(
      JSON.stringify({ emails: emailsToQueue }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});