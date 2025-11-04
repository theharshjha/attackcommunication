import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth-server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const extension = file.type.split('/')[1]
    const filename = `avatar-${session.user.id}-${Date.now()}.${extension}`
    
    // Ensure avatars directory exists
    const avatarDir = join(process.cwd(), 'public', 'avatars')
    await mkdir(avatarDir, { recursive: true })
    
    // Save file
    const filepath = join(avatarDir, filename)
    await writeFile(filepath, buffer)

    // Update user in database
    const avatarUrl = `/avatars/${filename}`
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({ url: avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 })
  }
}