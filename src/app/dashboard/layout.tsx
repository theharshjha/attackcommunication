// src/app/dashboard/layout.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Sidebar } from '@/components/dashboard/sidebar' // <-- Import our new component
import '@/app/globals.css'
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login')
    }
  }, [session, isPending, router])

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
      {/* Column 1: The New Sidebar */}
      {/* We pass the session user as a prop */}
      <Sidebar user={session.user} />

      {/* Main Content Area (for Columns 2 & 3) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}