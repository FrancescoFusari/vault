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

    console.log('Fetching email list...');
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
    console.log(`Found ${messages.length} emails to process`);
    
    const emails = await Promise.all(
      messages.map(async ({ id }: { id: string }) => {
        console.log(`Fetching details for email ${id}...`);
        const emailResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
            },
          }
        );
        
        if (!emailResponse.ok) {
          console.error(`Failed to fetch email ${id}:`, await emailResponse.text());
          return null;
        }
        
        const emailData = await emailResponse.json();
        console.log(`Email ${id} payload:`, JSON.stringify(emailData.payload, null, 2));
        return emailData;
      })
    );

    // Filter out any failed email fetches
    const validEmails = emails.filter(email => email !== null);

    // First, check which emails already exist in the queue
    const { data: existingEmails } = await supabase
      .from('email_processing_queue')
      .select('email_id')
      .eq('user_id', user.id)
      .in('email_id', validEmails.map(email => email.id));

    const existingEmailIds = new Set(existingEmails?.map(e => e.email_id) || []);

    // Filter out emails that already exist and prepare new ones for insertion
    const newEmails = validEmails.filter(email => !existingEmailIds.has(email.id));
    
    if (newEmails.length > 0) {
      const emailsToQueue = newEmails.map((email: any) => {
        // Decode email body
        let emailBody = '';
        console.log(`Processing email ${email.id} for body content...`);
        
        if (email.payload.parts) {
          // Handle multipart messages
          console.log(`Email ${email.id} has parts:`, email.payload.parts.length);
          const textPart = email.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          if (textPart && textPart.body.data) {
            console.log(`Found text part for email ${email.id}`);
            emailBody = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } else {
            console.log(`No text part found for email ${email.id}`);
          }
        } else if (email.payload.body.data) {
          // Handle single part messages
          console.log(`Email ${email.id} is single part`);
          emailBody = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else {
          console.log(`No body data found for email ${email.id}`);
        }

        console.log(`Final email body length for ${email.id}:`, emailBody.length);

        return {
          user_id: user.id,
          email_id: email.id,
          sender: email.payload.headers.find((h: any) => h.name === 'From').value,
          subject: email.payload.headers.find((h: any) => h.name === 'Subject').value,
          received_at: new Date(parseInt(email.internalDate)).toISOString(),
          email_body: emailBody || null,
        };
      });

      const { error: queueError } = await supabase
        .from('email_processing_queue')
        .insert(emailsToQueue);

      if (queueError) {
        throw queueError;
      }

      console.log(`Successfully queued ${newEmails.length} new emails`);
    } else {
      console.log('No new emails to queue');
    }

    return new Response(
      JSON.stringify({ 
        emails: emails.length,
        newEmailsQueued: newEmails.length,
        skippedEmails: emails.length - newEmails.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});