
export type SavedTimerMode = 'Focus' | 'Short Break' | 'Long Break'

export interface SavedTimerState {
  mode: SavedTimerMode
  focusMinutes: number
  remainingSeconds: number
  completedSessions: number
  selectedTask: string | null
  isRunning: boolean
  endsAt: number | null
}

const STORAGE_KEY = 'quiethours-timer'

export function saveTimerState(state: SavedTimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadTimerState(): SavedTimerState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return null

    const state = JSON.parse(saved) as SavedTimerState

    if (
      !['Focus', 'Short Break', 'Long Break'].includes(state.mode) ||
      !Number.isFinite(state.focusMinutes) ||
      !Number.isFinite(state.remainingSeconds) ||
      !Number.isFinite(state.completedSessions)
    ) {
      return null
    }

    // Restore the actual remaining time after a refresh.
    if (state.isRunning && state.endsAt !== null) {
      state.remainingSeconds = Math.max(
        0,
        Math.ceil((state.endsAt - Date.now()) / 1000)
      )
    }

    return state
  } catch {
    return null
  }
}

export function clearTimerState() {
  localStorage.removeItem(STORAGE_KEY)
}
