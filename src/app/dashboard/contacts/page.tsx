'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Mail, Phone, MessageSquare, User, X } from 'lucide-react'

interface Contact {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  lastContactedAt: string | null
  createdAt: string
  _count: {
    messages: number
  }
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const queryClient = useQueryClient()

  // Fetch contacts
  const { data, isLoading } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
  })

  const contacts: Contact[] = data?.contacts || []

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getContactName = (contact: Contact) => {
    return contact.name || contact.email || contact.phone || 'Unknown'
  }

  const getInitials = (contact: Contact) => {
    const name = getContactName(contact)
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Contact List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No contacts found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first contact to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add Contact →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition text-left ${
                    selectedContact?.id === contact.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
                      selectedContact?.id === contact.id
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}
                  >
                    {getInitials(contact)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{getContactName(contact)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {contact.email && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {contact._count.messages} messages
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Last: {formatDate(contact.lastContactedAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex-1 flex items-center justify-center">
        {selectedContact ? (
          <ContactDetails contact={selectedContact} onClose={() => setSelectedContact(null)} />
        ) : (
          <div className="text-center">
            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No contact selected</h3>
            <p className="text-sm text-gray-500">Select a contact to view details</p>
          </div>
        )}
      </div>

      {/* Add Contact Dialog */}
      {showAddDialog && <AddContactDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

function ContactDetails({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getContactName = (contact: Contact) => {
    return contact.name || contact.email || contact.phone || 'Unknown'
  }

  const getInitials = (contact: Contact) => {
    const name = getContactName(contact)
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl">
            {getInitials(contact)}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{getContactName(contact)}</h2>
            <p className="text-sm text-gray-500 mt-1">{contact._count.messages} messages</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Information</h3>
        
        {contact.email && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{contact.email}</p>
            </div>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{contact.phone}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Messages</p>
            <p className="text-sm font-medium text-gray-900">{contact._count.messages} total</p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Last contacted</span>
          <span className="text-gray-900 font-medium">{formatDate(contact.lastContactedAt)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Added</span>
          <span className="text-gray-900 font-medium">{formatDate(contact.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Start Conversation
        </button>
        <button
          onClick={() => setShowEditDialog(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
        >
          Edit
        </button>
      </div>

      {/* Edit Contact Dialog */}
      {showEditDialog && (
        <EditContactDialog
          contact={contact}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  )
}

function EditContactDialog({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [name, setName] = useState(contact.name || '')
  const [email, setEmail] = useState(contact.email || '')
  const [phone, setPhone] = useState(contact.phone || '')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      onClose()
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email && !phone) {
      setError('Please provide at least an email or phone number')
      return
    }

    updateMutation.mutate({ name, email, phone })
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Edit Contact</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={updateMutation.isPending}
          >
            <X className="h-5 w-5 text-grey-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p className="text-xs text-gray-500">* At least one of email or phone is required</p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddContactDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      onClose()
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email && !phone) {
      setError('Please provide at least an email or phone number')
      return
    }

    createMutation.mutate({ name, email, phone })
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Add New Contact</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={createMutation.isPending}
          >
            <X className="h-5 w-5 text-grey-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="text-black w-full px-3 py-2 border border-grey-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p className="text-xs text-gray-500">* At least one of email or phone is required</p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}