import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Protected paths
  const isDashboard = pathname.startsWith('/dashboard')
  // Auth paths
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')

  if (isDashboard && !token) {
    // Redirect to login if trying to access dashboard without token
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && token) {
    // Redirect to dashboard if logged in and trying to access login/signup
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
