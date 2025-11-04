import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Get the current user (you should already have one from signup)
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!user) {
    console.error('❌ No user found. Please sign up first!')
    return
  }

  console.log(`✅ Found user: ${user.email}`)

  // Create test contacts
  console.log('📇 Creating contacts...')

  // Helper function to upsert contact by unique field
  const upsertContact = async (data: {
    name?: string
    phone?: string
    email?: string
    lastContactedAt?: Date
  }) => {
    const where = data.phone ? { phone: data.phone } : data.email ? { email: data.email } : null
    if (!where) throw new Error('Must provide phone or email')
    
    const existing = await prisma.contact.findUnique({ where })
    if (existing) return existing
    
    return prisma.contact.create({ data })
  }

  const contacts = await Promise.all([
    upsertContact({
      name: 'Sarah Johnson',
      phone: '+14155238886',
      email: 'sarah.johnson@example.com',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    }),
    upsertContact({
      name: 'Mike Chen',
      phone: '+14155552222',
      email: 'mike.chen@example.com',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    }),
    upsertContact({
      name: 'Emily Rodriguez',
      phone: '+14155553333',
      email: 'emily.rodriguez@example.com',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    }),
    upsertContact({
      name: 'Alex Thompson',
      email: 'alex.thompson@example.com',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    }),
    upsertContact({
      name: 'Jessica Martinez',
      phone: '+14155554444',
      email: 'jessica.martinez@example.com',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    }),
  ])

  console.log(`✅ Created ${contacts.length} contacts`)

  // Create conversations and messages
  console.log('💬 Creating conversations and messages...')

  // Conversation 1: Sarah (Unassigned, SMS, Active)
  const conv1 = await prisma.conversation.create({
    data: {
      contactId: contacts[0].id,
      state: 'OPEN',
      assignedToId: null, // Unassigned -> goes to Inbound
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  })

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        contactId: contacts[0].id,
        channel: 'SMS',
        content: 'Hi! I have a question about your product pricing.',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        contactId: contacts[0].id,
        userId: user.id,
        channel: 'SMS',
        content: 'Hello Sarah! I\'d be happy to help you with that. What specific information are you looking for?',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        contactId: contacts[0].id,
        channel: 'SMS',
        content: 'I\'m interested in the enterprise plan. Can you send me more details?',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
  ])

  // Conversation 2: Mike (Assigned to you, WhatsApp)
  const conv2 = await prisma.conversation.create({
    data: {
      contactId: contacts[1].id,
      state: 'OPEN',
      assignedToId: user.id, // Assigned to you -> goes to My Work
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  })

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        contactId: contacts[1].id,
        channel: 'WHATSAPP',
        content: 'Hey! Thanks for reaching out. I\'d like to schedule a demo.',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        contactId: contacts[1].id,
        userId: user.id,
        channel: 'WHATSAPP',
        content: 'Absolutely! When works best for you? I have availability this week on Tuesday and Thursday.',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        contactId: contacts[1].id,
        channel: 'WHATSAPP',
        content: 'Tuesday at 2 PM would be perfect! 🎯',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    }),
  ])

  // Conversation 3: Emily (Unassigned, Email)
  const conv3 = await prisma.conversation.create({
    data: {
      contactId: contacts[2].id,
      state: 'OPEN',
      assignedToId: null,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  })

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv3.id,
        contactId: contacts[2].id,
        channel: 'EMAIL',
        content: 'Hi there,\n\nI\'m reaching out because I saw your company featured in TechCrunch. Very impressive!\n\nI\'d love to learn more about potential partnership opportunities.\n\nBest regards,\nEmily',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    }),
  ])

  // Conversation 4: Alex (Assigned, Waiting state)
  const conv4 = await prisma.conversation.create({
    data: {
      contactId: contacts[3].id,
      state: 'WAITING',
      assignedToId: user.id,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  })

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv4.id,
        contactId: contacts[3].id,
        channel: 'EMAIL',
        content: 'I need help troubleshooting an issue with my account.',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv4.id,
        contactId: contacts[3].id,
        userId: user.id,
        channel: 'EMAIL',
        content: 'Hi Alex! I\'d be happy to help. Can you provide more details about the issue you\'re experiencing? Screenshots would be helpful too.',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    }),
  ])

  // Conversation 5: Jessica (Unassigned, SMS, Multiple messages)
  const conv5 = await prisma.conversation.create({
    data: {
      contactId: contacts[4].id,
      state: 'OPEN',
      assignedToId: null,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  })

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conv5.id,
        contactId: contacts[4].id,
        channel: 'SMS',
        content: 'Hi! I saw your ad on Instagram. Can you tell me more about your services?',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv5.id,
        contactId: contacts[4].id,
        userId: user.id,
        channel: 'SMS',
        content: 'Thanks for your interest! We offer a comprehensive communication platform. Would you like me to send you our pricing guide?',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.5),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv5.id,
        contactId: contacts[4].id,
        channel: 'SMS',
        content: 'Yes please! And do you offer a free trial?',
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      },
    }),
  ])

  console.log('✅ Created 5 conversations with messages')

  // Add some notes
  console.log('📝 Creating notes...')

  await Promise.all([
    prisma.note.create({
      data: {
        contactId: contacts[0].id,
        userId: user.id,
        content: 'Very interested in enterprise features. Follow up with custom pricing.',
      },
    }),
    prisma.note.create({
      data: {
        contactId: contacts[1].id,
        userId: user.id,
        content: 'Scheduled demo for Tuesday 2PM. Send calendar invite.',
      },
    }),
  ])

  console.log('✅ Created notes')

  // Summary
  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   • ${contacts.length} contacts`)
  console.log(`   • 5 conversations`)
  console.log(`   • ~13 messages`)
  console.log(`   • 2 notes`)
  console.log('\n📥 Inbound (unassigned): 3 conversations')
  console.log('👤 My Work (assigned to you): 2 conversations')
  console.log('\n✨ Channels:')
  console.log('   • SMS: 2 conversations')
  console.log('   • WhatsApp: 1 conversation')
  console.log('   • Email: 2 conversations')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })