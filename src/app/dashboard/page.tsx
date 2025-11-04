'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  return (
    <div className="flex h-full">
      <ConversationList
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
      />
      <MessageThread conversationId={selectedConversationId} />
    </div>
  )
}