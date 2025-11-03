'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  MessageSquare, Users, Settings, LogOut, Search, 
  Bell, BarChart3, Zap, Plus 
} from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'

const navigation = [
  { name: 'Inbox', icon: MessageSquare, href: '/dashboard' },
  { name: 'Search', icon: Search, href: '/search' },
  { name: 'Activity', icon: Bell, href: '/activity' },
  { name: 'Contacts', icon: Users, href: '/contacts' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Settings', icon: Settings, href: '/settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login')
    }
  }, [session, isPending, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no session
  if (!session?.user) {
    return null
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Narrow */}
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        {/* User Avatar */}
        <div className="relative mb-6">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium cursor-pointer">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-gray-50 rounded-full"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-2">
          <button className="w-12 h-12 rounded-xl text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
            <Plus className="h-5 w-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-12 h-12 rounded-xl text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}