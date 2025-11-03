import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const { from, to, subject, text, html } = body

        const emailMatch = from.match(/<(.+)>/) || [null, from]
        const senderEmail = emailMatch[1] || from

        console.log(`📧 Received email from: ${senderEmail}`)

        let contact = await prisma.contact.findFirst({
            where: { email: senderEmail }
        })

        if (!contact) {

            const nameMatch = from.match(/^(.+)\s</)
            const senderName = nameMatch ? nameMatch[1].trim() : senderEmail

            contact = await prisma.contact.create({
                data: {
                    email: senderEmail,
                    name: senderName,
                }
            })
        }

        const message = await prisma.message.create({
            data: {
                channel: 'EMAIL',
                content: text || html || subject,
                direction: 'INBOUND',
                status: 'DELIVERED',
                contactId: contact.id,
            }
        })

        await prisma.contact.update({
            where: { id: contact.id },
            data: { lastContactedAt: new Date() }
        })

        console.log(`✅ Email saved to database`)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Email webhook error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}