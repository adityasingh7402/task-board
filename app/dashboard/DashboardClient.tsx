'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  status: 'Todo' | 'In Progress' | 'Done'
  createdAt: string
  userId: string
}

interface Props {
  userName: string
  initialTasks: Task[]
}

export default function DashboardClient({ userName, initialTasks }: Props) {
  const router = useRouter()
  // Initialize from server-fetched data — no useEffect needed
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [error, setError] = useState('')

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setAddingTask(true)
    setError('')

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
      })

      const data = await res.json()

      if (res.ok) {
        // Optimistically prepend the new task
        setTasks((prev) => [data.task, ...prev])
        setNewTaskTitle('')
      } else {
        setError(data.message || 'Failed to create task.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setAddingTask(false)
    }
  }

  const handleStatusChange = async (
    taskId: string,
    newStatus: 'Todo' | 'In Progress' | 'Done'
  ) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Failed to update task status.')
        // Rollback on failure
        setTasks(previousTasks)
      }
    } catch {
      setError('Failed to connect to the server.')
      setTasks(previousTasks)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setError('Logout failed.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight">Task Board</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Welcome,{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {userName}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-4 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Task Creation Form */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-medium">Create a New Task</h2>
          <form
            onSubmit={handleCreateTask}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              required
              disabled={addingTask}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-zinc-900 focus:border-zinc-950 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:bg-zinc-700 dark:focus:border-zinc-50"
            />
            <button
              type="submit"
              disabled={addingTask || !newTaskTitle.trim()}
              className="rounded-lg bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {addingTask ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </section>

        {/* Tasks List */}
        <section>
          <h2 className="mb-4 text-lg font-medium">Your Tasks</h2>

          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-zinc-500 dark:text-zinc-400">
                No tasks yet. Create one above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span
                    className={`pr-4 text-base font-medium ${
                      task.status === 'Done'
                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                        : ''
                    }`}
                  >
                    {task.title}
                  </span>

                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(
                        task.id,
                        e.target.value as 'Todo' | 'In Progress' | 'Done'
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none dark:bg-zinc-800 ${
                      task.status === 'Todo'
                        ? 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                        : task.status === 'In Progress'
                        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'
                    }`}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
