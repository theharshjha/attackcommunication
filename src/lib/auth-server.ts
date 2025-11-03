import { cookies } from 'next/headers'
import { auth } from './auth'

/**
 * Server-side session validation helper
 * Use this in API routes and server components to get authenticated user
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('better_auth.session_token')?.value

    if (!sessionToken) {
      return null
    }

    // Validate session with better-auth
    const session = await auth.api.getSession({
      headers: {
        cookie: `better_auth.session_token=${sessionToken}`
      }
    })

    return session
  } catch (error) {
    console.error('Session validation error:', error)
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
