import { cookies } from 'next/headers'
import { auth } from './auth'

/**
 * Server-side session validation helper
 * Use this in API routes and server components to get authenticated user
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('better-auth.session_token')?.value

    console.log('🍪 Session token present:', !!sessionToken)
    console.log('🍪 All cookies:', cookieStore.getAll().map(c => c.name))

    if (!sessionToken) {
      console.log('❌ No session token found')
      return null
    }

    console.log('🔐 Validating session with better-auth...')
    // Validate session with better-auth
    const session = await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`
      }
    })

    console.log('✅ Session validated:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    })

    return session
  } catch (error) {
    console.error('❌ Session validation error:', error)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes that require auth
 */
export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }

  return session
}
