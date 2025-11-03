'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ContactList } from '@/components/inbox/contact-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { ContactInfo } from '@/components/inbox/contact-info'

export default function InboxPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(true)

  const { data: contactData } = useQuery({
    queryKey: ['contact', selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return null
      const response = await fetch(`/api/contacts/${selectedContactId}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      return response.json()
    },
    enabled: !!selectedContactId,
  })

  return (
    <div className="flex h-full w-full">
      <ContactList
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
      />
      <MessageThread
        contactId={selectedContactId!}
        contact={contactData?.contact}
        onShowInfo={() => setShowInfo(!showInfo)}
      />
      {showInfo && selectedContactId && (
        <ContactInfo contact={contactData?.contact} />
      )}
    </div>
  )
}