import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSender } from '@/lib/integrations/factory'
import { getServerSession } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { contactId, channel, content } = body

    // Validate required fields
    if (!contactId || !channel || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get contact from database
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Determine recipient based on channel
    let recipient = ''
    if (channel === 'SMS' || channel === 'WHATSAPP') {
      recipient = contact.phone || ''
    } else if (channel === 'EMAIL') {
      recipient = contact.email || ''
    }

    if (!recipient) {
      return NextResponse.json(
        { error: `Contact missing ${channel === 'EMAIL' ? 'email' : 'phone'}` },
        { status: 400 }
      )
    }

    // Use factory to get the right integration
    const sender = createSender(channel as 'SMS' | 'WHATSAPP' | 'EMAIL')
    
    // Send message through external service (Twilio/Resend)
    const result = await sender.send({
      to: recipient,
      content: content,
    })

    // Save message to database for inbox display
    const message = await prisma.message.create({
      data: {
        channel: channel,
        content: content,
        direction: 'OUTBOUND',        // We sent it
        status: 'SENT',
        externalId: result.externalId, // Twilio SID or Resend ID
        contactId: contactId,
      }
    })

    // Update contact's last contacted time
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContactedAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      message: message 
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}


 