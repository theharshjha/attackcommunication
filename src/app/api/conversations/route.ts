import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel') // 'SMS', 'WHATSAPP', 'EMAIL', or null for all
    const workspace = searchParams.get('workspace') // 'inbound' or 'my-work'

    // For now, we'll group messages by contact to simulate conversations
    // Later we'll use the Conversation model
    
    // Get all contacts with messages
    const contacts = await prisma.contact.findMany({
      include: {
        messages: {
          where: channel ? { channel: channel as any } : {},
          orderBy: { createdAt: 'desc' },
          take: 1, // Just get the last message for preview
        },
      },
      where: {
        messages: {
          some: {}, // Only contacts with messages
        },
      },
    })

    // Transform into conversation format
    const conversations = contacts
      .filter(contact => contact.messages.length > 0)
      .map(contact => {
        const lastMessage = contact.messages[0]
        
        return {
          id: contact.id, // Using contact ID as conversation ID for now
          contact: {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
          },
          lastMessage: {
            content: lastMessage.content,
            channel: lastMessage.channel,
            direction: lastMessage.direction,
            createdAt: lastMessage.createdAt,
          },
          lastMessageAt: lastMessage.createdAt,
          unreadCount: 0, // TODO: Calculate unread
          state: 'OPEN', // TODO: Get from conversation model
        }
      })
      .sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}