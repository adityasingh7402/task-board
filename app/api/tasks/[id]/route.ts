import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const TASK_STATUSES = ['Todo', 'In Progress', 'Done'] as const

const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    error: 'Invalid task status. Must be Todo, In Progress, or Done.',
  }),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getAuthUser()

    if (!userPayload) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateTaskSchema.safeParse(body)

    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { status } = validated.data

    // Fetch task
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found.' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (task.userId !== userPayload.userId) {
      return NextResponse.json(
        { message: 'Forbidden. You do not own this task.' },
        { status: 403 }
      )
    }

    // Update status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ task: updatedTask }, { status: 200 })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
