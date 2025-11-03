'use client'

import { Phone, MessageSquare, Building2, Briefcase, Globe, Tag } from 'lucide-react'

interface ContactInfoProps {
  contact: any
}

export function ContactInfo({ contact }: ContactInfoProps) {
  if (!contact) return null

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 text-center border-b border-gray-200">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-2xl mx-auto mb-3">
          {contact.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {contact.name || 'Unknown Contact'}
        </h3>
        <p className="text-sm text-gray-600">{contact.phone}</p>

        <div className="flex items-center justify-center gap-2 mt-4">
          <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            <Phone className="h-5 w-5 text-gray-700" />
          </button>
          <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            <MessageSquare className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-4">
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

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Phone className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Phone</span>
          </div>
          <p className="text-sm text-gray-900 ml-6">{contact.phone || 'Not set'}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Website</span>
          </div>
          <p className="text-sm text-blue-600 ml-6 cursor-pointer hover:underline">
            Set a website...
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1.5">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Lead status</span>
          </div>
          <span className="ml-6 inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Lead
          </span>
        </div>

        <button className="text-sm text-gray-600 hover:text-gray-900 ml-6">
          + Add a property
        </button>
      </div>

      {/* Notes */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Notes</h4>
          <span className="text-xs text-gray-500">0</span>
        </div>
        <textarea
          placeholder="Write a note..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
        />
      </div>
    </div>
  )
}