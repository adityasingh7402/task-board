import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required.').trim(),
})

export async function GET() {
  try {
    const userPayload = await getAuthUser()

    if (!userPayload) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: { userId: userPayload.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error('Fetch tasks error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = await getAuthUser()

    if (!userPayload) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = createTaskSchema.safeParse(body)

    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { title } = validated.data

    const task = await prisma.task.create({
      data: {
        title,
        status: 'Todo',
        userId: userPayload.userId,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
