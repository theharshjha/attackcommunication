import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/db'

// Function to validate Twilio signature (security check)
const twilioSignature = twilio.validateRequest

export async function POST(req: NextRequest) {
  try {
    // Get request body as text (Twilio sends form data)
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    // Validate signature - make sure this is really from Twilio
    const signature = req.headers.get('x-twilio-signature') || ''
    const url = req.url
    
    const isValid = twilioSignature(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      Object.fromEntries(params)
    )

    // Security: Reject if signature doesn't match
    if (!isValid) {
      console.error('Invalid Twilio signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Extract message data from Twilio's POST
    const messageSid = params.get('MessageSid')      // Twilio's unique ID
    const from = params.get('From')                  // Sender's number
    const to = params.get('To')                      // Your Twilio number
    const bodyText = params.get('Body')              // Message content
    
    // Detect channel: WhatsApp has "whatsapp:" prefix
    const channel = from?.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS'
    
    // Clean phone numbers (remove "whatsapp:" if present)
    const cleanFrom = from?.replace('whatsapp:', '') || ''

    // Find or create contact in database
    let contact = await prisma.contact.findFirst({
      where: { phone: cleanFrom }
    })

    // If first time texting, create new contact
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: cleanFrom,
          name: cleanFrom, // Use phone as name initially
        }
      })
    }

    // Save incoming message to database
    const message = await prisma.message.create({
      data: {
        channel: channel,
        externalId: messageSid,
        content: bodyText || '',
        direction: 'INBOUND',      // They sent it to us
        status: 'DELIVERED',
        contactId: contact.id,
      }
    })

    // Update last contact time
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastContactedAt: new Date() }
    })

    console.log(`✅ Received ${channel} from ${cleanFrom}`)

    // Return success to Twilio (must return 200 or Twilio retries)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}