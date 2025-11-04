import type { Prisma, PrismaClient } from '@prisma/client'

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient

export async function getOrCreateConversation(
  client: PrismaClientOrTx,
  contactId: string
) {
  let conversation = await client.conversation.findFirst({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
  })

  if (!conversation) {
    conversation = await client.conversation.create({
      data: { contactId },
    })
  }

  return conversation
}
