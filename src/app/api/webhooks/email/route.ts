import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getOrCreateConversation } from '@/lib/conversation'

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.EMAIL_WEBHOOK_SECRET
    if (secret) {
      const provided = req.headers.get('x-webhook-secret')
      if (provided !== secret) {
        console.error('Email webhook error: invalid webhook secret')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    const body = await req.json()

    const { from, subject, text, html } = body

    if (!from || typeof from !== 'string') {
      return NextResponse.json({ error: 'Missing sender' }, { status: 400 })
    }

    const emailMatch = from.match(/<(.+)>/) || [null, from]
    const senderEmail = (emailMatch[1] || from).trim()

    if (!senderEmail) {
      return NextResponse.json({ error: 'Invalid sender email' }, { status: 400 })
    }

    console.log(`📧 Received email from: ${senderEmail}`)

    let contact = await prisma.contact.findFirst({
      where: { email: senderEmail },
    })

    if (!contact) {
      const nameMatch = from.match(/^(.+)\s</)
      const senderName = nameMatch ? nameMatch[1].trim() : senderEmail

      contact = await prisma.contact.create({
        data: {
          email: senderEmail,
          name: senderName,
        },
      })
    }

    const activityDate = new Date()
    const content = (text || html || subject || '').toString().trim()

    if (!content) {
      return NextResponse.json({ error: 'Email body is empty' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const conversation = await getOrCreateConversation(tx, contact!.id)

      await tx.message.create({
        data: {
          channel: 'EMAIL',
          content,
          direction: 'INBOUND',
          status: 'DELIVERED',
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

    console.log('✅ Email saved to database')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
