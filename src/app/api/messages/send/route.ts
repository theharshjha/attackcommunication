import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth-server'
import { createSender } from '@/lib/integrations/factory'
import { getOrCreateConversation } from '@/lib/conversation'
import type { Channel, MessageStatus } from '@prisma/client'

const ALLOWED_CHANNELS: Channel[] = ['SMS', 'WHATSAPP', 'EMAIL']

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
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactId, channel, content } = await req.json()

    if (!contactId || typeof contactId !== 'string') {
      return NextResponse.json({ error: 'Invalid contactId' }, { status: 400 })
    }

    if (!channel || !ALLOWED_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: 'Unsupported channel' }, { status: 400 })
    }

    const sanitizedContent = typeof content === 'string' ? content.trim() : ''
    if (!sanitizedContent) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    let recipient = ''
    if (channel === 'SMS' || channel === 'WHATSAPP') {
      recipient = contact.phone?.trim() || ''
    } else if (channel === 'EMAIL') {
      recipient = contact.email?.trim() || ''
    }

    if (!recipient) {
      return NextResponse.json(
        { error: `Contact missing ${channel === 'EMAIL' ? 'email' : 'phone'}` },
        { status: 400 }
      )
    }

    const sender = createSender(channel as 'SMS' | 'WHATSAPP' | 'EMAIL')

    let externalId: string | null = null
    let status: MessageStatus = 'SENT'

    try {
      const result = await sender.send({
        to: recipient,
        content: sanitizedContent,
      })
      externalId = result.externalId ?? null
      const normalized = result.status?.toLowerCase() ?? ''
      status = STATUS_MAPPING[normalized] ?? 'SENT'
    } catch (error) {
      console.error('Send message dispatch error:', error)
      return NextResponse.json(
        { error: 'Failed to dispatch message to provider' },
        { status: 502 }
      )
    }

    const activityDate = new Date()

    const message = await prisma.$transaction(async (tx) => {
      const conversation = await getOrCreateConversation(tx, contactId)

      const createdMessage = await tx.message.create({
        data: {
          channel,
          content: sanitizedContent,
          direction: 'OUTBOUND',
          status,
          externalId,
          contactId,
          userId: session.user.id,
          conversationId: conversation.id,
        },
      })

      await Promise.all([
        tx.contact.update({
          where: { id: contactId },
          data: { lastContactedAt: activityDate },
        }),
        tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: activityDate, state: 'OPEN' },
        }),
      ])

      return createdMessage
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
