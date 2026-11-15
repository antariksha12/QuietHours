
import { useEffect, useState } from 'react'
import { getSessions } from '../utils/sessions'
import type { FocusSession } from '../utils/sessions'

function Statistics() {
  const [sessions, setSessions] = useState<FocusSession[]>([])

  useEffect(() => {
    setSessions(getSessions())
  }, [])

  const totalMinutes = sessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  )

  const today = new Date().toDateString()

  const todaySessions = sessions.filter(
    session => new Date(session.completedAt).toDateString() === today
  )

  const todayMinutes = todaySessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  )

  const average = sessions.length
    ? Math.round(totalMinutes / sessions.length)
    : 0

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    const minutes = sessions
      .filter(session =>
        new Date(session.completedAt).toDateString() === date.toDateString()
      )
      .reduce((total, session) => total + session.durationMinutes, 0)

    return {
      label: date.toLocaleDateString([], { weekday: 'short' }),
      minutes,
    }
  })

  const highest = Math.max(...lastSevenDays.map(day => day.minutes), 1)

  return (
    <div className="mt-8 space-y-7">

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Total focus time',
            value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
          },
          {
            label: 'Sessions completed',
            value: sessions.length.toString(),
          },
          {
            label: "Today's focus",
            value: `${todayMinutes} min`,
          },
          {
            label: 'Average session',
            value: `${average} min`,
          },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-[#383832] bg-[#20211e] p-5"
          >
            <p className="text-xs text-[#aaa295]">{item.label}</p>
            <p className="mt-3 text-2xl font-medium">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          WEEKLY OVERVIEW
        </p>

        <h3 className="mt-2 text-xl font-medium">
          Your focus activity
        </h3>

        <div className="mt-8 flex h-48 items-end justify-between gap-3">
          {lastSevenDays.map(day => (
            <div
              key={day.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-3"
            >
              <span className="text-[10px] text-[#aaa295]">
                {day.minutes > 0 ? `${day.minutes}m` : ''}
              </span>

              <div className="flex h-32 w-full items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t-md bg-[#899477] transition-all"
                  style={{
                    height: `${Math.max((day.minutes / highest) * 100, day.minutes > 0 ? 5 : 0)}%`,
                  }}
                />
              </div>

              <span className="text-xs text-[#aaa295]">
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          YOUR CONSISTENCY
        </p>

        <h3 className="mt-3 text-xl font-medium">
          {sessions.length === 0
            ? 'Your progress starts here.'
            : 'Every session counts.'}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#aaa295]">
          {sessions.length === 0
            ? 'Complete your first focus session to start building your statistics.'
            : `You've completed ${sessions.length} focus sessions and spent ${totalMinutes} minutes focusing. Keep building your routine at a comfortable pace.`}
        </p>
      </section>

    </div>
  )
}

export default Statistics
