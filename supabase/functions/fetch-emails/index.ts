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
    const authHeader = req.headers.get('Authorization')!
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
      throw new Error('Unauthorized')
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
      throw new Error('Gmail integration not found')
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
        throw new Error(`Failed to refresh token: ${errorData}`)
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
        throw new Error('Failed to update integration')
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
      throw new Error(`Failed to fetch email list: ${errorData}`)
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
          const errorData = await emailResponse.text()
          console.error(`Error fetching email ${id}:`, errorData)
          throw new Error(`Failed to fetch email ${id}: ${errorData}`)
        }
        
        const emailData = await emailResponse.json()
        console.log(`Email ${id} structure:`, JSON.stringify(emailData.payload, null, 2))
        
        // Extract email body
        let emailBody = ''
        if (emailData.payload) {
          if (emailData.payload.parts) {
            // Handle multipart message
            for (const part of emailData.payload.parts) {
              if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                if (part.body?.data) {
                  emailBody = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                  console.log(`Found email body in part with mime type: ${part.mimeType}`)
                  break
                }
              }
            }
          } else if (emailData.payload.body?.data) {
            // Handle single part message
            emailBody = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            console.log('Found email body in single part message')
          }
        }

        if (!emailBody) {
          console.log('No email body found in the message')
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

    // Store emails in queue
    const { error: queueError } = await supabaseClient
      .from('email_processing_queue')
      .upsert(
        emailDetails.map((email: any) => ({
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
      throw new Error('Failed to store emails in queue')
    }

    console.log('Successfully processed and stored emails')

    return new Response(
      JSON.stringify({ success: true, emails: emailDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-emails function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})