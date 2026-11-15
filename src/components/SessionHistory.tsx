
import { useEffect, useState } from 'react'
import { getSessions } from '../utils/sessions'
import type { FocusSession } from '../utils/sessions'

function SessionHistory() {
  const [sessions, setSessions] = useState<FocusSession[]>([])

  useEffect(() => {
    setSessions(getSessions())
  }, [])

  const totalMinutes = sessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  )

  const formatDate = (date: string) =>
    new Date(date).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="mt-8 space-y-7">

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#383832] bg-[#20211e] p-5">
          <p className="text-xs text-[#aaa295]">Completed sessions</p>
          <p className="mt-2 text-3xl font-medium">{sessions.length}</p>
        </div>

        <div className="rounded-xl border border-[#383832] bg-[#20211e] p-5">
          <p className="text-xs text-[#aaa295]">Total focus time</p>
          <p className="mt-2 text-3xl font-medium">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </p>
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          YOUR ACTIVITY
        </p>
        <h3 className="mt-2 text-xl font-medium">Completed sessions</h3>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#383832] px-5 py-12 text-center">
            <p className="text-lg">Your history starts here.</p>
            <p className="mt-2 text-sm text-[#aaa295]">
              Complete a focus session and it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center gap-4 rounded-xl border border-[#383832] bg-[#20211e] p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#899477]/10">
                  <span className="text-lg text-[#899477]">✓</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">
                    {session.task}
                  </p>
                  <p className="mt-1 text-xs text-[#aaa295]">
                    {formatDate(session.completedAt)}
                  </p>
                </div>

                <p className="shrink-0 text-sm text-[#c5c3a7]">
                  {session.durationMinutes} min
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default SessionHistory
