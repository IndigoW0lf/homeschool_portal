import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InviteRequest {
  email: string
  familyName: string
  inviterName: string
  inviteCode: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, familyName, inviterName, inviteCode }: InviteRequest = await req.json()

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const inviteUrl = `https://lunara.quest/invite/${inviteCode}`

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lunara Quest <hello@lunara.quest>',
        to: [email],
        subject: `${inviterName} invited you to join ${familyName} on Lunara Quest`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23; color: #e4e4f0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid #2a2a4a;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">✨ Lunara Quest</h1>
                </div>
                
                <h2 style="color: #e4e4f0; margin-bottom: 16px;">You're Invited!</h2>
                
                <p style="color: #a0a0b8; line-height: 1.6;">
                  <strong style="color: #e4e4f0;">${inviterName}</strong> has invited you to join 
                  <strong style="color: #a78bfa;">${familyName}</strong> on Lunara Quest, 
                  a magical homeschool companion.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                
                <p style="color: #6b6b80; font-size: 14px; margin-top: 24px;">
                  Or copy this link: <a href="${inviteUrl}" style="color: #a78bfa;">${inviteUrl}</a>
                </p>
                
                <p style="color: #6b6b80; font-size: 12px; margin-top: 32px; text-align: center;">
                  This invitation expires in 7 days.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Resend error:', error)
      throw new Error(error.message || 'Failed to send email')
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
