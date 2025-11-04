'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User, MessageSquare, Mail, Phone, Calendar, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  lastContactedAt: string | null
  _count: {
    messages: number
  }
}

interface Conversation {
  id: string
  contactId: string
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
    createdAt: string
  } | null
  lastMessageAt: string
  state: 'OPEN' | 'WAITING' | 'CLOSED'
  unreadCount: number
}

interface Message {
  id: string
  content: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  direction: 'INBOUND' | 'OUTBOUND'
  createdAt: string
  contact: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
  }
  conversationId: string
}

type SearchTab = 'all' | 'contacts' | 'conversations' | 'messages'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const router = useRouter()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['search-contacts', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { contacts: [] }
      const params = new URLSearchParams({ search: debouncedQuery })
      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error('Failed to search contacts')
      return response.json()
    },
    enabled: debouncedQuery.length > 0 && (activeTab === 'all' || activeTab === 'contacts'),
  })

  // Search conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['search-conversations', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { conversations: [] }
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to search conversations')
      const data = await response.json()
      // Filter conversations by contact name/email/phone
      const filtered = data.conversations.filter((conv: Conversation) => {
        const query = debouncedQuery.toLowerCase()
        const name = conv.contact.name?.toLowerCase() || ''
        const email = conv.contact.email?.toLowerCase() || ''
        const phone = conv.contact.phone?.toLowerCase() || ''
        const message = conv.lastMessage?.content?.toLowerCase() || ''
        return name.includes(query) || email.includes(query) || phone.includes(query) || message.includes(query)
      })
      return { conversations: filtered }
    },
    enabled: debouncedQuery.length > 0 && (activeTab === 'all' || activeTab === 'conversations'),
  })

  // Search messages (simplified - in production you'd want a dedicated endpoint)
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['search-messages', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { messages: [] }
      // Note: This is a simplified approach. In production, you'd want a dedicated search endpoint
      return { messages: [] }
    },
    enabled: debouncedQuery.length > 0 && (activeTab === 'all' || activeTab === 'messages'),
  })

  const contacts: Contact[] = contactsData?.contacts || []
  const conversations: Conversation[] = conversationsData?.conversations || []
  const messages: Message[] = messagesData?.messages || []

  const isLoading = contactsLoading || conversationsLoading || messagesLoading
  const hasResults = contacts.length > 0 || conversations.length > 0 || messages.length > 0

  const getContactName = (contact: { name: string | null; email: string | null; phone: string | null }) => {
    return contact.name || contact.email || contact.phone || 'Unknown'
  }

  const getInitials = (contact: { name: string | null; email: string | null; phone: string | null }) => {
    const name = getContactName(contact)
    return name.charAt(0).toUpperCase()
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const dateValue = new Date(date)
    const diff = now.getTime() - dateValue.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return dateValue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-gray-900">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const tabs: { id: SearchTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: contacts.length + conversations.length + messages.length },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
    { id: 'conversations', label: 'Conversations', count: conversations.length },
    { id: 'messages', label: 'Messages', count: messages.length },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Search</h1>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts, conversations, and messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="text-black w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          {debouncedQuery && (
            <div className="flex items-center gap-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-blue-700' : 'bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {!debouncedQuery ? (
            <div className="text-center py-20">
              <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search everything</h3>
              <p className="text-sm text-gray-500">Find contacts, conversations, and messages</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-20">
              <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-sm text-gray-500">
                No matches for &quot;{debouncedQuery}&quot;. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contacts Results */}
              {(activeTab === 'all' || activeTab === 'contacts') && contacts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Contacts ({contacts.length})
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => router.push('/dashboard/contacts')}
                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {getInitials(contact)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1">
                            {highlightText(getContactName(contact), debouncedQuery)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {highlightText(contact.email, debouncedQuery)}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {highlightText(contact.phone, debouncedQuery)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {contact._count.messages} messages
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations Results */}
              {(activeTab === 'all' || activeTab === 'conversations') && conversations.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Conversations ({conversations.length})
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          const workspace = conv.state === 'OPEN' && !conv.contact ? 'inbound' : 'my-work'
                          router.push(`/dashboard/${workspace === 'inbound' ? '' : 'my-work'}`)
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {getInitials(conv.contact)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {highlightText(getContactName(conv.contact), debouncedQuery)}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              conv.state === 'OPEN' ? 'bg-green-100 text-green-700' :
                              conv.state === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {conv.state}
                            </span>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage.direction === 'OUTBOUND' && 'You: '}
                              {highlightText(conv.lastMessage.content, debouncedQuery)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>{conv.lastMessage?.channel}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(conv.lastMessageAt)}</span>
                            {conv.unreadCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">
                                  {conv.unreadCount} unread
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Results */}
              {(activeTab === 'all' || activeTab === 'messages') && messages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Messages ({messages.length})
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => router.push('/dashboard')}
                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {getInitials(message.contact)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1">
                            {getContactName(message.contact)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {highlightText(message.content, debouncedQuery)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{message.channel}</span>
                            <span>•</span>
                            <span>{formatDate(message.createdAt)}</span>
                            <span>•</span>
                            <span>{message.direction === 'INBOUND' ? 'Received' : 'Sent'}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}