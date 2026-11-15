
const STORAGE_KEY = 'quiethours-daily-goal'

export interface DailyGoal {
  targetMinutes: number
  completedMinutes: number
  date: string
}

function getToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function getDailyGoal(): DailyGoal {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      const goal = JSON.parse(saved) as DailyGoal

      if (goal.date === getToday()) {
        return goal
      }
    }
  } catch {
    // Use the default goal if saved data is invalid.
  }

  return {
    targetMinutes: 120,
    completedMinutes: 0,
    date: getToday(),
  }
}

export function saveDailyGoal(goal: DailyGoal) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal))
}

export function addFocusMinutes(minutes: number) {
  const goal = getDailyGoal()

  saveDailyGoal({
    ...goal,
    completedMinutes: goal.completedMinutes + minutes,
  })
}
