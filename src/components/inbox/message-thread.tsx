'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Phone, Video, MoreVertical, Send, Paperclip, 
  Smile, Check, Image as ImageIcon, X 
} from 'lucide-react'
import { useState } from 'react'

interface Message {
  id: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  createdAt: Date
}

interface MessageThreadProps {
  contactId: string
  contact: any
  onShowInfo: () => void
}

export function MessageThread({ contactId, contact, onShowInfo }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?contactId=${contactId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    enabled: !!contactId,
  })

  const messages: Message[] = data?.messages || []

  const handleSend = async () => {
    if (!message.trim() || sending) return

    const tempMessage = message
    setMessage('')
    setSending(true)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          channel: contact?.phone ? 'SMS' : 'EMAIL',
          content: tempMessage,
        }),
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['messages', contactId] })
      } else {
        setMessage(tempMessage)
      }
    } catch (error) {
      console.error('Failed to send:', error)
      setMessage(tempMessage)
    } finally {
      setSending(false)
    }
  }

  if (!contactId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500">
            Choose a contact to start messaging
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
            {contact?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">
              {contact?.name || contact?.phone || 'Unknown'}
            </h2>
            <p className="text-xs text-gray-500">
              {contact?.phone}
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
          <button 
            onClick={onShowInfo}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[65%] rounded-2xl px-4 py-2 ${
                  msg.direction === 'OUTBOUND'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs ${
                    msg.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          {/* Input */}
          <div className="flex-1 bg-white border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Write a message..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 placeholder:text-gray-400 text-sm"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded transition">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded transition">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded transition">
                  <Smile className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}