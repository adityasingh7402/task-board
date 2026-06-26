import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const userPayload = await getAuthUser()

  if (!userPayload) {
    redirect('/login')
  }

  const [user, tasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { name: true },
    }),
    prisma.task.findMany({
      where: { userId: userPayload.userId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!user) {
    redirect('/login')
  }

  // Serialize Date objects before passing to client component
  const initialTasks = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    status: t.status as 'Todo' | 'In Progress' | 'Done',
  }))

  return <DashboardClient userName={user.name} initialTasks={initialTasks} />
}
