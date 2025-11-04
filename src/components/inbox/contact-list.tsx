'use client'

import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, Filter } from 'lucide-react'
import { useState } from 'react'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  lastContactedAt: Date | null
  _count: {
    messages: number
  }
}

interface ContactListProps {
  selectedContactId: string | null
  onSelectContact: (id: string) => void
}

export function ContactList({ selectedContactId, onSelectContact }: ContactListProps) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
  })

  const contacts: Contact[] = data?.contacts || []

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <button className="text-sm text-gray-600 hover:text-gray-900">Calls</button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Open <ChevronDown className="h-3 w-3" />
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Unread
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition ml-auto">
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="text-black w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition ${
                  selectedContactId === contact.id ? 'bg-blue-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                    selectedContactId === contact.id
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {contact.name?.charAt(0).toUpperCase() || 
                     contact.phone?.charAt(1) || 
                     '?'}
                  </div>
                  {selectedContactId === contact.id && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {contact.name || contact.phone || contact.email}
                    </p>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {contact.lastContactedAt ? formatTime(new Date(contact.lastContactedAt)) : ''}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 truncate">
                    You: Last message preview...
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) {
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return time
  }
  if (hours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  if (days < 7) {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' })
    return day
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}