import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch all contacts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')  // Optional search query

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ]
    } : {}

    // Fetch contacts with message counts
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        _count: {
          select: {
            messages: true,  // Count of messages per contact
          }
        }
      },
      orderBy: {
        lastContactedAt: 'desc'  // Most recent first
      }
    })

    return NextResponse.json({ contacts })

  } catch (error) {
    console.error('Fetch contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST - Create new contact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone } = body

    // Validate at least one contact method
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Provide at least email or phone' },
        { status: 400 }
      )
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
      }
    })

    return NextResponse.json({ contact })

  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}