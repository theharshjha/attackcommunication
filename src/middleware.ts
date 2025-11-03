import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/signup']

const protectedRoutes = ['/dashboard', '/contacts', '/analytics', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Try multiple possible cookie names for better-auth
  const sessionToken = 
    request.cookies.get('better_auth.session_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('session_token')?.value

  const isAuthenticated = !!sessionToken

  // Debug: Log cookie checking (remove in production)
  if (pathname === '/dashboard') {
    console.log('Middleware debug - Available cookies:', request.cookies.getAll().map(c => c.name))
    console.log('Middleware debug - Session token found:', !!sessionToken)
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}