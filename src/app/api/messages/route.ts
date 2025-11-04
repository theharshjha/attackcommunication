import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contactIdParam = searchParams.get('contactId')?.trim() || null
    const conversationIdParam = searchParams.get('conversationId')?.trim() || null

    if (!contactIdParam && !conversationIdParam) {
      return NextResponse.json(
        { error: 'Either contactId or conversationId is required' },
        { status: 400 }
      )
    }

    let conversationId: string | null = conversationIdParam

    if (contactIdParam) {
      const conversation = await prisma.conversation.findFirst({
        where: { contactId: contactIdParam },
        orderBy: { lastMessageAt: 'desc' },
      })

      conversationId = conversation?.id ?? conversationId
    }

    if (conversationIdParam && conversationIdParam !== conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationIdParam },
        select: { contactId: true },
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (contactIdParam && conversation.contactId !== contactIdParam) {
        return NextResponse.json({ error: 'Conversation mismatch' }, { status: 400 })
      }

      conversationId = conversationIdParam
    }

    if (!conversationId) {
      return NextResponse.json({ messages: [], conversationId: null })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ messages, conversationId })
  } catch (error) {
    console.error('Fetch messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
