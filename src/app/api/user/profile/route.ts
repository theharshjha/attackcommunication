import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth-server'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const rawName = typeof body.name === 'string' ? body.name.trim() : null

    if (rawName !== null && rawName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    if (rawName && rawName.length > 120) {
      return NextResponse.json(
        { error: 'Name is too long' },
        { status: 400 }
      )
    }

    const updateData: { name?: string | null } = {}
    if (rawName !== null) {
      updateData.name = rawName
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No changes supplied' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { user: updatedUser },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
