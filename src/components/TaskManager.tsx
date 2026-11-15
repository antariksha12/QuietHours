
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Priority = 'Low' | 'Medium' | 'High'
type Filter = 'All' | 'Active' | 'Completed'

interface Task {
  id: string
  title: string
  priority: Priority
  dueDate: string
  completed: boolean
}

interface TaskManagerProps {
  onStartTask: (title: string) => void
}

const STORAGE_KEY = 'quiethours-tasks'

function TaskManager({ onStartTask }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) as Task[] : []
    } catch {
      return []
    }
  })

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      priority,
      dueDate,
      completed: false,
    }

    setTasks(current => [newTask, ...current])
    setTitle('')
    setPriority('Medium')
    setDueDate('')
  }

  const toggleTask = (id: string) => {
    setTasks(current =>
      current.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks(current => current.filter(task => task.id !== id))
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'Active') return !task.completed
    if (filter === 'Completed') return task.completed
    return true
  })

  const completedCount = tasks.filter(task => task.completed).length

  const priorityStyle: Record<Priority, string> = {
    Low: 'text-[#899477] bg-[#899477]/10',
    Medium: 'text-[#d0b77e] bg-[#d0b77e]/10',
    High: 'text-[#d58d7e] bg-[#d58d7e]/10',
  }

  return (
    <div className="mt-8 space-y-7">

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#383832] bg-[#20211e] p-4">
          <p className="text-xs text-[#aaa295]">Total</p>
          <p className="mt-2 text-2xl font-medium">{tasks.length}</p>
        </div>

        <div className="rounded-xl border border-[#383832] bg-[#20211e] p-4">
          <p className="text-xs text-[#aaa295]">Active</p>
          <p className="mt-2 text-2xl font-medium">
            {tasks.length - completedCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#383832] bg-[#20211e] p-4">
          <p className="text-xs text-[#aaa295]">Completed</p>
          <p className="mt-2 text-2xl font-medium">{completedCount}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          NEW TASK
        </p>

        <form onSubmit={addTask} className="mt-5 space-y-4">
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            className="w-full rounded-lg border border-[#383832] bg-[#171816] px-4 py-3 text-sm text-[#e9e2d5] outline-none placeholder:text-[#77776e] focus:border-[#899477]"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-[#aaa295]">
                Priority
              </label>
              <select
                value={priority}
                onChange={event => setPriority(event.target.value as Priority)}
                className="w-full rounded-lg border border-[#383832] bg-[#171816] px-3 py-3 text-sm text-[#e9e2d5] outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-[#aaa295]">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                className="w-full rounded-lg border border-[#383832] bg-[#171816] px-3 py-3 text-sm text-[#e9e2d5] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full rounded-lg bg-[#899477] px-5 py-3 text-sm font-medium text-[#171816] transition hover:bg-[#a1ad8c] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            + Add task
          </button>
        </form>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
              YOUR PLANNER
            </p>
            <h3 className="mt-2 text-xl font-medium">Your tasks</h3>
          </div>

          <div className="flex gap-1 rounded-lg border border-[#383832] bg-[#20211e] p-1">
            {(['All', 'Active', 'Completed'] as Filter[]).map(item => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-3 py-2 text-xs ${
                  filter === item
                    ? 'bg-[#383832] text-[#e9e2d5]'
                    : 'text-[#aaa295] hover:text-[#e9e2d5]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#383832] px-5 py-12 text-center">
            <p className="text-lg text-[#e9e2d5]">
              {tasks.length === 0 ? 'A fresh start.' : 'Nothing here yet.'}
            </p>
            <p className="mt-2 text-sm text-[#aaa295]">
              {tasks.length === 0
                ? 'Add your first task and organise your day.'
                : 'Try another filter or add a new task.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`flex items-start gap-3 rounded-xl border border-[#383832] bg-[#20211e] p-4 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.completed ? 'Mark as active' : 'Complete task'}
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    task.completed
                      ? 'border-[#899477] bg-[#899477] text-[#171816]'
                      : 'border-[#77776e] hover:border-[#899477]'
                  }`}
                >
                  {task.completed && <span className="text-xs">✓</span>}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`break-words text-sm ${
                    task.completed
                      ? 'text-[#aaa295] line-through'
                      : 'text-[#e9e2d5]'
                  }`}>
                    {task.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[10px] ${priorityStyle[task.priority]}`}>
                      {task.priority}
                    </span>

                    {task.dueDate && (
                      <span className="text-[10px] text-[#aaa295]">
                        Due: {task.dueDate}
                      </span>
                    )}
                  </div>

                  {!task.completed && (
                    <button
                      onClick={() => onStartTask(task.title)}
                      className="mt-3 text-xs text-[#c5c3a7] hover:text-[#e9e2d5]"
                    >
                      Focus on this →
                    </button>
                  )}
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                  className="shrink-0 px-2 text-lg text-[#77776e] hover:text-[#d58d7e]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default TaskManager
