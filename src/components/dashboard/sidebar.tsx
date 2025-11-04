'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  Settings,
  Inbox,
  User,
  Search,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getInitials = (name?: string | null) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '?'
  }
  const { data: stats } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: async () => {
      const response = await fetch('/api/conversations/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch inbox stats')
      }
      return response.json()
    },
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Navigation items
  const mainNav = [
    { href: '/dashboard/search', label: 'Search', icon: Search },
    { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
    // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const inboxes = [
    { 
      href: '/dashboard', 
      label: 'Inbound', 
      icon: Inbox,
      badge: stats?.unassigned ?? 0,
      description: 'Unassigned conversations'
    },
    { 
      href: '/dashboard/my-work', 
      label: 'My Work', 
      icon: User,
      badge: stats?.assigned ?? 0,
      description: 'Assigned to you'
    },
  ]

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* User Menu */}
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || 'User'}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(user?.name)}
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* User info */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>

            <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {/* Quick Actions */}
        <div className="space-y-0.5 mb-4">
          {mainNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Inboxes Section */}
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Inboxes
          </h3>
          <div className="space-y-0.5">
            {inboxes.map((inbox) => {
              const Icon = inbox.icon
              const isActive = pathname === inbox.href

              return (
                <Link
                  key={inbox.href}
                  href={inbox.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{inbox.label}</span>
                      {inbox.badge > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                        }`}>
                          {inbox.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {inbox.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </aside>
  )
}