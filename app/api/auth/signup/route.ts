import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/jwt'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.').trim(),
  email: z.string().email('Please enter a valid email.').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long.').trim(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = signupSchema.safeParse(body)
    
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { name, email, password } = validated.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Sign JWT token
    const token = signJWT({ userId: user.id, email: user.email })

    // Create response
    const response = NextResponse.json(
      {
        message: 'Signup successful.',
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
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
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
