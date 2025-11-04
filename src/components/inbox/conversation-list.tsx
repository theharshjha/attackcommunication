'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'

interface Conversation {
  id: string
  contact: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
  }
  lastMessage: {
    content: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    direction: 'INBOUND' | 'OUTBOUND'
    createdAt: Date
  }
  lastMessageAt: Date
  unreadCount: number
  state: 'OPEN' | 'WAITING' | 'CLOSED'
}

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

const CHANNEL_CONFIG = {
  SMS: { emoji: '📱', label: 'SMS' },
  WHATSAPP: { emoji: '💬', label: 'WhatsApp' },
  EMAIL: { emoji: '📧', label: 'Email' },
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState<string>('OPEN')

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', channelFilter, stateFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelFilter) params.append('channel', channelFilter)
      if (stateFilter) params.append('state', stateFilter.toUpperCase())

      const response = await fetch(`/api/conversations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch conversations')
      return response.json()
    },
  })

  const conversations: Conversation[] = data?.conversations || []

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 24) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    }
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getContactName = (contact: Conversation['contact']) => {
    return contact.name || contact.phone || contact.email || 'Unknown'
  }

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-3">
          <h2 className="text-base font-semibold text-gray-900">Chats</h2>
          <button className="text-sm text-gray-600">Calls</button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Open <ChevronDown className="h-3 w-3" />
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Unread
          </button>
          <button className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <Filter className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Channel Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => setChannelFilter(null)}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              channelFilter === null
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {Object.entries(CHANNEL_CONFIG).map(([channel, config]) => (
            <button
              key={channel}
              onClick={() => setChannelFilter(channel)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                channelFilter === channel
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {config.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => {
              const channelConfig = CHANNEL_CONFIG[conv.lastMessage.channel]
              const isSelected = selectedId === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition text-left ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {getContactName(conv.contact).charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {getContactName(conv.contact)}
                      </p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs">{channelConfig.emoji}</span>
                      <p className="text-xs text-gray-600 truncate">
                        {conv.lastMessage.direction === 'OUTBOUND' && 'You: '}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}