import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count unassigned conversations
    const unassigned = await prisma.conversation.count({
      where: {
        state: 'OPEN',
        assignedToId: null,
      },
    })

    // Count conversations assigned to current user
    const assigned = await prisma.conversation.count({
      where: {
        state: 'OPEN',
        assignedToId: session.user.id,
      },
    })

    // Count waiting conversations
    const waiting = await prisma.conversation.count({
      where: {
        state: 'WAITING',
      },
    })

    // Count closed conversations
    const closed = await prisma.conversation.count({
      where: {
        state: 'CLOSED',
      },
    })

    return NextResponse.json({
      unassigned,
      assigned,
      waiting,
      closed,
    })
  } catch (error) {
    console.error('Fetch conversation stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation stats' },
      { status: 500 }
    )
  }
}
