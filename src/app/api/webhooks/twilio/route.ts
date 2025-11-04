import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/db'
import { getOrCreateConversation } from '@/lib/conversation'
import type { Channel, MessageStatus } from '@prisma/client'

// Test endpoint to verify webhook is accessible
export async function GET() {
  console.log('✅ Twilio webhook GET test - endpoint is accessible!')
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Twilio webhook endpoint is working',
    timestamp: new Date().toISOString()
  })
}

const twilioSignature = twilio.validateRequest

const STATUS_MAPPING: Record<string, MessageStatus> = {
  queued: 'PENDING',
  sending: 'PENDING',
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
  undelivered: 'FAILED',
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 Twilio webhook received')
    
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!authToken) {
      console.error('❌ Twilio webhook error: TWILIO_AUTH_TOKEN is not configured')
      return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)

    console.log('📦 Webhook data:', {
      From: params.get('From'),
      Body: params.get('Body'),
      MessageSid: params.get('MessageSid'),
    })

    // Skip signature validation in development (for ngrok/localhost)
    const skipValidation = process.env.NODE_ENV === 'development' || process.env.SKIP_TWILIO_VALIDATION === 'true'
    
    if (!skipValidation) {
      const signature = req.headers.get('x-twilio-signature') || ''
      const url = req.url

      const isValid = twilioSignature(
        authToken,
        signature,
        url,
        Object.fromEntries(params)
      )

      if (!isValid) {
        console.error('❌ Invalid Twilio signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    } else {
      console.log('⚠️  Skipping signature validation (development mode)')
    }

    const messageSid = params.get('MessageSid')?.trim()
    const from = params.get('From')?.trim()
    const bodyText = params.get('Body')?.trim() ?? ''

    if (!from) {
      return NextResponse.json({ error: 'Missing sender' }, { status: 400 })
    }

    const channel: Channel = from.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS'
    const cleanFrom = from.replace('whatsapp:', '')

    if (!cleanFrom) {
      return NextResponse.json({ error: 'Invalid sender number' }, { status: 400 })
    }

    if (messageSid) {
      const existing = await prisma.message.findUnique({
        where: {
          channel_externalId: {
            channel,
            externalId: messageSid,
          },
        },
      })

      if (existing) {
        return NextResponse.json({ success: true })
      }
    }

    let contact = await prisma.contact.findFirst({
      where: { phone: cleanFrom },
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: cleanFrom,
          name: cleanFrom,
        },
      })
    }

    const activityDate = new Date()
    const externalId = messageSid ?? null
    const status = STATUS_MAPPING[(params.get('SmsStatus') || '').toLowerCase()] ?? 'DELIVERED'

    await prisma.$transaction(async (tx) => {
      const conversation = await getOrCreateConversation(tx, contact!.id)

      await tx.message.create({
        data: {
          channel,
          externalId,
          content: bodyText,
          direction: 'INBOUND',
          status,
          contactId: contact!.id,
          conversationId: conversation.id,
        },
      })

      await Promise.all([
        tx.contact.update({
          where: { id: contact!.id },
          data: { lastContactedAt: activityDate },
        }),
        tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: activityDate, state: 'OPEN' },
        }),
      ])
    })

    console.log(`✅ Successfully saved ${channel} message from ${cleanFrom}`)
    console.log(`📝 Message content: ${bodyText}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
