import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout successful.' },
    { status: 200 }
  )

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  })

  return response
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirect') || '/login'

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  })

  return response
}
