
import { useEffect, useState } from 'react'
import {
  getDailyGoal,
  saveDailyGoal,
  type DailyGoal as DailyGoalType,
} from '../utils/dailyGoals'

interface DailyGoalProps {
  refreshKey?: number
}

function DailyGoal({ refreshKey = 0 }: DailyGoalProps) {
  const [goal, setGoal] = useState<DailyGoalType>(getDailyGoal)
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(String(goal.targetMinutes))

  useEffect(() => {
    const updated = getDailyGoal()
    setGoal(updated)
    setTarget(String(updated.targetMinutes))
  }, [refreshKey])

  const progress = Math.min(
    100,
    Math.round((goal.completedMinutes / goal.targetMinutes) * 100)
  )

  const handleSave = () => {
    const minutes = Number(target)

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      return
    }

    const updated = { ...goal, targetMinutes: minutes }
    saveDailyGoal(updated)
    setGoal(updated)
    setEditing(false)
  }

  return (
    <section className="rounded-2xl border border-[#383832] bg-[#20211e] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#aaa295]">Daily focus goal</p>
          <h2 className="mt-1 text-xl font-semibold text-[#e9e2d5]">
            {Math.floor(goal.completedMinutes / 60)}h{' '}
            {goal.completedMinutes % 60}m
            <span className="text-sm font-normal text-[#aaa295]">
              {' '}/ {Math.floor(goal.targetMinutes / 60)}h{' '}
              {goal.targetMinutes % 60}m
            </span>
          </h2>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-[#aaa295] transition hover:text-[#e9e2d5]"
        >
          {editing ? 'Cancel' : 'Edit goal'}
        </button>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#383832]">
        <div
          className="h-full rounded-full bg-[#899477] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-[#aaa295]">
        <span>{progress}% completed</span>
        <span>
          {Math.max(0, goal.targetMinutes - goal.completedMinutes)} min left
        </span>
      </div>

      {editing && (
        <div className="mt-5 flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="1440"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="w-full rounded-lg border border-[#383832] bg-[#292a25] px-3 py-2 text-[#e9e2d5] outline-none focus:border-[#899477]"
            placeholder="Target minutes"
          />

          <button
            onClick={handleSave}
            className="rounded-lg bg-[#899477] px-4 py-2 text-sm font-medium text-[#171816] transition hover:opacity-90"
          >
            Save
          </button>
        </div>
      )}

      {progress >= 100 && (
        <p className="mt-4 text-sm text-[#899477]">
          Daily focus goal completed. Well done.
        </p>
      )}
    </section>
  )
}

export default DailyGoal
