'use client'

import { Phone, MessageSquare, Building2, Briefcase, Globe, Tag, Calendar } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  createdAt?: string
  lastContactedAt?: string | null
}

interface Conversation {
  id: string
  state: 'OPEN' | 'WAITING' | 'CLOSED'
  assignedTo?: {
    id: string
    name: string | null
    email: string | null
  } | null
  createdAt: string
}

interface Note {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

interface ContactInfoProps {
  contact: Contact | null
  conversation?: Conversation | null
}

export function ContactInfo({ contact, conversation }: ContactInfoProps) {
  const [note, setNote] = useState('')
  const queryClient = useQueryClient()

  const { data: notesData, isLoading: isNotesLoading, isError: notesError } = useQuery<{ notes: Note[] }>({
    queryKey: ['notes', contact?.id],
    queryFn: async () => {
      if (!contact?.id) {
        return { notes: [] }
      }
      const response = await fetch(`/api/notes?contactId=${contact.id}`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      return response.json()
    },
    enabled: !!contact?.id,
    staleTime: 10_000,
  })

  const notes: Note[] = notesData?.notes ?? []

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact?.id,
          content,
        }),
      })
      if (!response.ok) throw new Error('Failed to add note')
      return response.json()
    },
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['notes', contact?.id] })
    },
    onError: (error) => {
      console.error('Add note error:', error)
      alert('Failed to add note')
    },
  })

  if (!contact) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-sm text-gray-500">Select a conversation</p>
      </div>
    )
  }

  const formatDate = (date?: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 text-center border-b border-gray-200">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-2xl mx-auto mb-3">
          {contact.name?.charAt(0).toUpperCase() || contact.phone?.charAt(1) || '?'}
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {contact.name || 'Unknown Contact'}
        </h3>
        {contact.phone && (
          <p className="text-sm text-gray-600">{contact.phone}</p>
        )}
        {contact.email && (
          <p className="text-sm text-gray-500">{contact.email}</p>
        )}

        <div className="flex items-center justify-center gap-2 mt-4">
          <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            <MessageSquare className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Conversation Details */}
      {conversation && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Conversation
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                conversation.state === 'OPEN' 
                  ? 'bg-green-100 text-green-700' 
                  : conversation.state === 'WAITING'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {conversation.state}
              </span>
            </div>
            
            {conversation.assignedTo && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Assigned to</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {conversation.assignedTo.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-sm text-gray-900">{conversation.assignedTo.name || 'Unknown'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm text-gray-900">{formatDate(conversation.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details */}
      <div className="p-6 space-y-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Contact Details
        </h4>

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Company</span>
          </div>
          <p className="text-sm text-gray-900 ml-6">Not set</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Role</span>
          </div>
          <p className="text-sm text-gray-900 ml-6">Not set</p>
        </div>

        {contact.phone && (
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1.5">
              <Phone className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Phone</span>
            </div>
            <p className="text-sm text-gray-900 ml-6 font-mono">{contact.phone}</p>
          </div>
        )}

        {contact.email && (
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1.5">
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Email</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">{contact.email}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Last Contacted</span>
          </div>
          <p className="text-sm text-gray-900 ml-6">{formatDate(contact.lastContactedAt)}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Tags</span>
          </div>
          <div className="ml-6">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Customer
            </span>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="p-6 border-t border-gray-200 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Internal Notes</h4>
          <span className="text-xs text-gray-500">
            {isNotesLoading ? 'Loading…' : `${notes.length}`}
          </span>
        </div>

        <div className="space-y-3 mb-3">
          {isNotesLoading ? (
            <p className="text-xs text-gray-500 italic">Loading notes...</p>
          ) : notesError ? (
            <p className="text-xs text-red-600">Failed to load notes.</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No notes yet</p>
          ) : (
            notes.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {item.content}
                </p>
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {item.user.name || item.user.email || 'Unknown teammate'}
                  </span>
                  <span className="flex-shrink-0">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note... (visible to team only)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 resize-none"
          />
          <button
            onClick={() => note.trim() && addNoteMutation.mutate(note)}
            disabled={!note.trim() || addNoteMutation.isPending}
            className="mt-2 w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  )
}