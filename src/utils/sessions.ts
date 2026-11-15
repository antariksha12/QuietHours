
export interface FocusSession {
  id: string
  task: string
  durationMinutes: number
  completedAt: string
}

const STORAGE_KEY = 'quiethours-sessions'

export function getSessions(): FocusSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as FocusSession[] : []
  } catch {
    return []
  }
}

export function saveCompletedSession(
  task: string | null,
  durationMinutes: number
) {
  const sessions = getSessions()

  const newSession: FocusSession = {
    id: crypto.randomUUID(),
    task: task || 'Independent focus session',
    durationMinutes,
    completedAt: new Date().toISOString(),
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([newSession, ...sessions])
  )
}
