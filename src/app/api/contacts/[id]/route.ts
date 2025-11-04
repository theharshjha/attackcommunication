import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Fetch contact error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    
    const name = typeof body.name === 'string' ? body.name.trim() : null
    const email = typeof body.email === 'string' ? body.email.trim() : null
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Provide at least email or phone' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}
