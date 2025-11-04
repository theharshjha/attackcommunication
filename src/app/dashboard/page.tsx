'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, ChevronDown, User as UserIcon, Mail, Phone, MessageSquare, FileText, Clock, Tag as TagIcon } from 'lucide-react'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

interface Conversation {
  id: string
  contactId: string
  contact: Contact
  lastMessage: {
    content: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    direction: 'INBOUND' | 'OUTBOUND'
    createdAt: string
  } | null
  lastMessageAt: string
  state: 'OPEN' | 'WAITING' | 'CLOSED'
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
  unreadCount: number
}

type ActiveTab = 'conversation' | 'details' | 'notes'
type ChannelFilter = 'ALL' | 'SMS' | 'WHATSAPP' | 'EMAIL'
type StateFilter = 'ALL' | 'OPEN' | 'WAITING' | 'CLOSED'

const CHANNEL_CONFIG = {
  SMS: { emoji: '💬', label: 'SMS', color: 'bg-blue-100 text-blue-700' },
  WHATSAPP: { emoji: 'W', label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  EMAIL: { emoji: '📧', label: 'Email', color: 'bg-purple-100 text-purple-700' },
}

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('conversation')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('ALL')
  const [stateFilter, setStateFilter] = useState<StateFilter>('OPEN')

  // Fetch conversations for Inbound (unassigned)
  const { data, isLoading } = useQuery({
    queryKey: ['conversations', channelFilter, stateFilter, 'inbound'],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelFilter !== 'ALL') params.append('channel', channelFilter)
      if (stateFilter !== 'ALL') params.append('state', stateFilter)
      params.append('workspace', 'inbound')

      const response = await fetch(`/api/conversations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch conversations')
      return response.json()
    },
    refetchInterval: 10000, // Poll every 10 seconds for new conversations
    refetchOnWindowFocus: true,
  })

  const conversations: Conversation[] = data?.conversations || []
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  const getContactName = (contact: Contact) => {
    return contact.name || contact.email || contact.phone || 'Unknown'
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const dateValue = new Date(date)
    const diff = now.getTime() - dateValue.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) {
      return dateValue.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    }
    return dateValue.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex h-full">
      {/* COLUMN 2: Triage List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Inbound</h2>

          {/* Filters */}
          <div className="space-y-2">
            {/* State Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStateFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  stateFilter === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All States
              </button>
              <button
                onClick={() => setStateFilter('OPEN')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  stateFilter === 'OPEN'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStateFilter('WAITING')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  stateFilter === 'WAITING'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Waiting
              </button>
            </div>

            {/* Channel Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChannelFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  channelFilter === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Channels
              </button>
              <button
                onClick={() => setChannelFilter('SMS')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  channelFilter === 'SMS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💬 SMS
              </button>
              <button
                onClick={() => setChannelFilter('WHATSAPP')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  channelFilter === 'WHATSAPP'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                W
              </button>
              <button
                onClick={() => setChannelFilter('EMAIL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  channelFilter === 'EMAIL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📧
              </button>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No conversations</h3>
              <p className="text-sm text-gray-500">All unassigned conversations will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => {
                const isSelected = selectedConversationId === conv.id
                const channelConfig = conv.lastMessage
                  ? CHANNEL_CONFIG[conv.lastMessage.channel]
                  : null

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition text-left ${
                      isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}
                    >
                      {getContactName(conv.contact).charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {getContactName(conv.contact)}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      {conv.lastMessage && channelConfig && (
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0 ${channelConfig.color}`}
                          >
                            {channelConfig.emoji}
                          </span>
                          <p className="text-xs text-gray-600 truncate flex-1">
                            {conv.lastMessage.direction === 'OUTBOUND' && 'You: '}
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        {conv.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                            conv.state === 'OPEN'
                              ? 'bg-green-100 text-green-700'
                              : conv.state === 'WAITING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {conv.state}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: Action Pane */}
      {selectedConversation ? (
        <ActionPane
          conversation={selectedConversation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
            <p className="text-sm text-gray-500">Select a conversation to view details</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionPane({
  conversation,
  activeTab,
  onTabChange,
}: {
  conversation: Conversation
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}) {
  const queryClient = useQueryClient()

  const assignMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign' }),
      })
      if (!response.ok) throw new Error('Failed to assign conversation')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const getContactName = (contact: Contact) => {
    return contact.name || contact.email || contact.phone || 'Unknown'
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top: Contact Details */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getContactName(conversation.contact)}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              {conversation.contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {conversation.contact.phone}
                </span>
              )}
              {conversation.contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {conversation.contact.email}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assignMutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Assigning...
              </>
            ) : (
              'Assign to Me'
            )}
          </button>
        </div>
      </div>

      {/* Middle: Tabbed View */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-1 px-6">
          <button
            onClick={() => onTabChange('conversation')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'conversation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Conversation
          </button>
          <button
            onClick={() => onTabChange('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon className="h-4 w-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => onTabChange('notes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Notes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversation' && <ConversationTab conversationId={conversation.id} />}
        {activeTab === 'details' && <DetailsTab contact={conversation.contact} />}
        {activeTab === 'notes' && <NotesTab contactId={conversation.contactId} />}
      </div>

      {/* Bottom: Polymorphic Composer */}
      <div className="border-t border-gray-200 p-4">
        <Composer channel={conversation.lastMessage?.channel || 'SMS'} conversationId={conversation.id} />
      </div>
    </div>
  )
}

function ConversationTab({ conversationId }: { conversationId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    refetchInterval: 3000, // Poll every 3 seconds for near real-time
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  })

  const messages = data?.messages || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-2 ${
              message.direction === 'OUTBOUND'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p
              className={`text-xs mt-1 ${
                message.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailsTab({ contact }: { contact: Contact }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              type="text"
              defaultValue={contact.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              defaultValue={contact.email || ''}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              defaultValue={contact.phone || ''}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">CRM Fields</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
            <input
              type="text"
              placeholder="Company name"
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <input
              type="text"
              placeholder="Job title"
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lead Status</label>
            <select className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>New</option>
              <option>Contacted</option>
              <option>Qualified</option>
              <option>Proposal</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotesTab({ contactId }: { contactId: string }) {
  const [note, setNote] = useState('')
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notes', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/notes?contactId=${contactId}`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      return response.json()
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          content,
        }),
      })
      if (!response.ok) throw new Error('Failed to add note')
      return response.json()
    },
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['notes', contactId] })
    },
    onError: (error) => {
      console.error('Add note error:', error)
      alert('Failed to add note')
    },
  })

  const notes = data?.notes || []

  return (
    <div className="p-6 space-y-4">
      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => note.trim() && addNoteMutation.mutate(note)}
          disabled={!note.trim() || addNoteMutation.isPending}
          className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
        </button>
      </div>

      <div className="space-y-3">
        {notes.map((note: any) => (
          <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-900">{note.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Composer({ channel, conversationId }: { channel: 'SMS' | 'WHATSAPP' | 'EMAIL'; conversationId: string }) {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const queryClient = useQueryClient()

  // Fetch conversation to get contactId
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      return response.json()
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: conversationData?.conversation?.contactId,
          channel,
          content: data.content,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setMessage('')
      setSubject('')
      setCc('')
      setBcc('')
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !conversationData?.conversation?.contactId) return
    sendMutation.mutate({ content: message })
  }

  if (channel === 'EMAIL') {
    return (
      <form onSubmit={handleSend} className="space-y-3">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="Cc"
            className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            placeholder="Bcc"
            className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          disabled={sendMutation.isPending}
          className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || sendMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sendMutation.isPending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Sending...
            </>
          ) : (
            'Send Email'
          )}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSend} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend(e)
          }
        }}
        placeholder={`Send ${channel === 'SMS' ? 'SMS' : 'WhatsApp'} message...`}
        disabled={sendMutation.isPending}
        className="text-black flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!message.trim() || sendMutation.isPending}
        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {sendMutation.isPending ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Sending...
          </>
        ) : (
          'Send'
        )}
      </button>
    </form>
  )
}