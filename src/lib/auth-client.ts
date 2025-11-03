import { createAuthClient } from "better-auth/react"

// For development, use localhost; for production, NEXT_PUBLIC_APP_URL is required
const baseURL = process.env.NEXT_PUBLIC_APP_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
  console.error('WARNING: NEXT_PUBLIC_APP_URL is not set in production. Authentication may fail.')
}

export const authClient = createAuthClient({
  baseURL
})

export const { signIn, signOut, signUp, useSession } = authClient