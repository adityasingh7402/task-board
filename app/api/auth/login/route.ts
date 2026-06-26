import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required.').trim(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = loginSchema.safeParse(body)

    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { email, password } = validated.data

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Sign JWT token
    const token = signJWT({ userId: user.id, email: user.email })

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful.',
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 200 }
    )

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
