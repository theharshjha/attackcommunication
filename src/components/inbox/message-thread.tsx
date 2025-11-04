'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { 
  Phone, 
  Video, 
  Check, 
  X, 
  MoreVertical, 
  Send,
  ChevronDown 
} from 'lucide-react'

interface Message {
  id: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  createdAt: Date
}

interface MessageThreadProps {
  conversationId: string | null
}

const CHANNEL_CONFIG = {
  SMS: { emoji: '📱', label: 'SMS', color: 'blue' },
  WHATSAPP: { emoji: '💬', label: 'WhatsApp', color: 'green' },
  EMAIL: { emoji: '📧', label: 'Email', color: 'purple' },
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('SMS')
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const queryClient = useQueryClient()

  // Fetch contact details
  const { data: contactData } = useQuery({
    queryKey: ['contact', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const response = await fetch(`/api/contacts/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      return response.json()
    },
    enabled: !!conversationId,
  })

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const response = await fetch(`/api/messages?contactId=${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    enabled: !!conversationId,
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; channel: string }) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: conversationId,
          channel: data.channel,
          content: data.content,
        }),
      })
      if (!response.ok) throw new Error('Failed to send')
      return response.json()
    },
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const contact = contactData?.contact
  const messages: Message[] = messagesData?.messages || []

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return
    sendMutation.mutate({ content: message, channel: selectedChannel })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Determine available channels
  const availableChannels: Array<'SMS' | 'WHATSAPP' | 'EMAIL'> = []
  if (contact?.phone) {
    availableChannels.push('SMS', 'WHATSAPP')
  }
  if (contact?.email) {
    availableChannels.push('EMAIL')
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getContactName = () => {
    return contact?.name || contact?.phone || contact?.email || 'Unknown'
  }

  // Empty state
  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No conversation selected
          </h3>
          <p className="text-sm text-gray-500">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium">
            {getContactName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{getContactName()}</h2>
            <p className="text-sm text-gray-500">
              {contact?.phone || contact?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Phone className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Video className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Check className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const channelConfig = CHANNEL_CONFIG[msg.channel]
            const isOutbound = msg.direction === 'OUTBOUND'

            return (
              <div
                key={msg.id}
                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOutbound
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs">{channelConfig.emoji}</span>
                    <span className={`text-xs ${
                      isOutbound ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOutbound && (
                      <span className={`text-xs ${
                        msg.status === 'DELIVERED' ? 'text-blue-100' : 'text-blue-200'
                      }`}>
                        {msg.status === 'DELIVERED' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          {/* Channel Selector */}
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <span>{CHANNEL_CONFIG[selectedChannel].emoji}</span>
              <span className="font-medium">{CHANNEL_CONFIG[selectedChannel].label}</span>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>

            {/* Channel Dropdown */}
            {showChannelMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                <div className="p-1">
                  {availableChannels.map((channel) => {
                    const config = CHANNEL_CONFIG[channel]
                    return (
                      <button
                        key={channel}
                        onClick={() => {
                          setSelectedChannel(channel)
                          setShowChannelMenu(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition ${
                          selectedChannel === channel
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 bg-white border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 placeholder:text-gray-400 text-sm"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            {sendMutation.isPending ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {sendMutation.isError && (
          <p className="text-xs text-red-600 mt-2">Failed to send message. Try again.</p>
        )}
      </div>
    </div>
  )
}