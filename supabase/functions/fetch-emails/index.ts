import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('Starting email fetch process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user ID from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: userError?.message || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated successfully')

    // Get Gmail integration for user
    const { data: integrations, error: integrationError } = await supabaseClient
      .from('gmail_integrations')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (integrationError || !integrations) {
      console.error('Error getting Gmail integration:', integrationError)
      return new Response(
        JSON.stringify({ error: 'Gmail integration not found. Please reconnect your Gmail account.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found Gmail integration')

    // Check if token is expired and refresh if needed
    if (new Date(integrations.expires_at) <= new Date()) {
      console.log('Token expired, refreshing...')
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: integrations.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Token refresh failed:', errorData)
        return new Response(
          JSON.stringify({ error: `Failed to refresh token: ${errorData}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokens = await response.json()

      // Update integration with new token
      const { error: updateError } = await supabaseClient
        .from('gmail_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating integration:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update integration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      integrations.access_token = tokens.access_token
      console.log('Token refreshed successfully')
    }

    // Fetch emails
    console.log('Fetching email list...')
    const listResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
      {
        headers: {
          Authorization: `Bearer ${integrations.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!listResponse.ok) {
      const errorData = await listResponse.text()
      console.error('Error fetching email list:', errorData)
      return new Response(
        JSON.stringify({ error: `Failed to fetch email list: ${errorData}` }),
        { status: listResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const listData = await listResponse.json()
    const messages = listData.messages || []
    console.log(`Found ${messages.length} messages`)

    // Fetch details for each email
    const emailDetails = await Promise.all(
      messages.map(async ({ id }: { id: string }) => {
        console.log(`Fetching details for email ${id}...`)
        const emailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
          {
            headers: {
              Authorization: `Bearer ${integrations.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!emailResponse.ok) {
          console.error(`Error fetching email ${id}:`, await emailResponse.text())
          return null
        }
        
        const emailData = await emailResponse.json()
        
        // Extract email body
        let emailBody = ''
        if (emailData.payload) {
          if (emailData.payload.parts) {
            // Handle multipart message
            for (const part of emailData.payload.parts) {
              if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                if (part.body?.data) {
                  emailBody = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                  break
                }
              }
            }
          } else if (emailData.payload.body?.data) {
            // Handle single part message
            emailBody = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          }
        }

        // Get headers
        const headers = emailData.payload.headers
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
        const from = headers.find((h: any) => h.name === 'From')?.value || ''
        const date = headers.find((h: any) => h.name === 'Date')?.value || ''

        return {
          id: emailData.id,
          threadId: emailData.threadId,
          subject,
          from,
          receivedAt: date,
          body: emailBody
        }
      })
    )

    // Filter out any null values from failed email fetches
    const validEmails = emailDetails.filter(email => email !== null)

    // Store emails in queue
    const { error: queueError } = await supabaseClient
      .from('email_processing_queue')
      .upsert(
        validEmails.map((email: any) => ({
          user_id: user.id,
          email_id: email.id,
          sender: email.from,
          subject: email.subject,
          received_at: new Date(email.receivedAt).toISOString(),
          email_body: email.body,
          status: 'pending'
        }))
      )

    if (queueError) {
      console.error('Error storing emails in queue:', queueError)
      return new Response(
        JSON.stringify({ error: 'Failed to store emails in queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully processed and stored emails')

    return new Response(
      JSON.stringify({ success: true, emails: validEmails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-emails function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})