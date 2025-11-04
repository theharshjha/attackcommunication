import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Channel, ConversationState, Prisma } from '@prisma/client'
import { getServerSession } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelParam = searchParams.get('channel')
    const workspace = searchParams.get('workspace') // 'inbound' or 'my-work'
    const stateParam = searchParams.get('state')

    console.log('🔍 Fetching conversations:', {
      userId: session.user.id,
      workspace,
      channel: channelParam,
      state: stateParam
    })

    // Build where clause
    const where: Prisma.ConversationWhereInput = {}

    // Filter by workspace
    if (workspace === 'my-work') {
      where.assignedToId = session.user.id
    } else if (workspace === 'inbound') {
      where.assignedToId = null
      where.state = { in: [ConversationState.OPEN, ConversationState.WAITING] }
    }

    // Filter by state
    if (stateParam && (stateParam === 'OPEN' || stateParam === 'WAITING' || stateParam === 'CLOSED')) {
      where.state = stateParam as ConversationState
    }

    // Filter by channel
    if (channelParam && (channelParam === 'SMS' || channelParam === 'WHATSAPP' || channelParam === 'EMAIL')) {
      where.messages = {
        some: {
          channel: channelParam as Channel
        }
      }
    }

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Transform response
    const response = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = conv.messages[0] ?? null

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            direction: 'INBOUND',
            status: { not: 'READ' },
          },
        })

        return {
          id: conv.id,
          contactId: conv.contact.id,
          contact: conv.contact,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                channel: lastMessage.channel,
                direction: lastMessage.direction,
                createdAt: lastMessage.createdAt,
              }
            : null,
          lastMessageAt: conv.lastMessageAt,
          state: conv.state,
          assignedTo: conv.assignedTo,
          unreadCount,
        }
      })
    )

    return NextResponse.json({ conversations: response })
  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}