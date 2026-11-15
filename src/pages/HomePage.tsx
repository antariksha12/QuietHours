
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Page } from '../App'
import TaskManager from '../components/TaskManager'
import SessionHistory from '../components/SessionHistory'
import Statistics from '../components/Statistics'
import DailyGoal from '../components/DailyGoal'
import Settings, { getUserSettings } from '../components/Settings'
import LoFiPlayer from '../components/LoFiPlayer'
import { saveCompletedSession } from '../utils/sessions'
import { addFocusMinutes } from '../utils/dailyGoals'
import {
  loadTimerState,
  saveTimerState,
  type SavedTimerState,
} from '../utils/timerStorage'
import {
  sendTimerNotification,
  requestNotificationPermission,
} from '../utils/notifications'

interface HomePageProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const navigation: Page[] = [
  'Overview',
  'Focus',
  'My Tasks',
  'Statistics',
  'History',
]

type TimerMode = 'Focus' | 'Short Break' | 'Long Break'

const backgrounds = [
  {
    name: 'Forest Cabin',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=90',
  },
  {
    name: 'Rainy Window',
    url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2000&q=90',
  },
  {
    name: 'Warm Library',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2000&q=90',
  },
]

function FocusTimer({
  onExit,
  selectedTask,
  onClearTask,
  isVisible,
  onFocusComplete,
}: {
  onExit: () => void
  selectedTask: string | null
  onClearTask: () => void
  isVisible: boolean
  onFocusComplete: () => void
}) {
  const preferences = getUserSettings()
  const [savedTimer] = useState<SavedTimerState | null>(() => loadTimerState())

  const [focusMinutes, setFocusMinutes] = useState(
    savedTimer?.focusMinutes ?? preferences.focusDuration
  )
  const [customMinutes, setCustomMinutes] = useState(
    String(savedTimer?.focusMinutes ?? preferences.focusDuration)
  )
  const [useCustom, setUseCustom] = useState(
    savedTimer
      ? ![15, 25, 30, 45, 60].includes(savedTimer.focusMinutes)
      : false
  )
  const [mode, setMode] = useState<TimerMode>(
    savedTimer?.mode ?? 'Focus'
  )
  const [seconds, setSeconds] = useState(
    savedTimer?.remainingSeconds ?? preferences.focusDuration * 60
  )
  const [isRunning, setIsRunning] = useState(
    savedTimer?.isRunning ?? false
  )
  const [endsAt, setEndsAt] = useState<number | null>(
    savedTimer?.endsAt ?? null
  )
  const [completedSessions, setCompletedSessions] = useState(
    savedTimer?.completedSessions ?? 0
  )
  const [showBackgrounds, setShowBackgrounds] = useState(false)
  const [background, setBackground] = useState(backgrounds[0].url)

  const completionKey = useRef<string | null>(null)

  const focusDuration = focusMinutes * 60
  const breakDuration = preferences.shortBreakDuration * 60
  const longBreakDuration = preferences.longBreakDuration * 60

  useEffect(() => {
    if (!isRunning || endsAt === null) return

    const updateTimer = () => {
      setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }

    updateTimer()

    const interval = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(interval)
  }, [isRunning, endsAt])

  useEffect(() => {
    saveTimerState({
      mode,
      focusMinutes,
      remainingSeconds: seconds,
      completedSessions,
      selectedTask,
      isRunning,
      endsAt,
    })
  }, [
    mode,
    focusMinutes,
    seconds,
    completedSessions,
    selectedTask,
    isRunning,
    endsAt,
  ])

  useEffect(() => {
    if (!isRunning || seconds > 0 || endsAt === null) return

    const key = `${mode}-${endsAt}`
    if (completionKey.current === key) return
    completionKey.current = key

    if (mode === 'Focus') {
      saveCompletedSession(selectedTask, focusMinutes)
      addFocusMinutes(focusMinutes)
      onFocusComplete()

      if (preferences.notificationsEnabled) {
        sendTimerNotification(
          'Focus session completed!',
          'Your focus session is over. Time to take a break.'
        )
      }

      const nextCount = completedSessions + 1
      const isLongBreak = nextCount % 4 === 0
      const nextBreak = isLongBreak ? longBreakDuration : breakDuration

      setCompletedSessions(nextCount)
      setMode(isLongBreak ? 'Long Break' : 'Short Break')
      setSeconds(nextBreak)
      setEndsAt(Date.now() + nextBreak * 1000)
      setIsRunning(true)
    } else {
      if (preferences.notificationsEnabled) {
        sendTimerNotification(
          'Break completed!',
          'Your next focus session is ready.'
        )
      }

      setMode('Focus')
      setSeconds(focusDuration)
      setEndsAt(null)
      setIsRunning(false)
    }
  }, [
    isRunning,
    seconds,
    endsAt,
    mode,
    completedSessions,
    selectedTask,
    focusMinutes,
    breakDuration,
    longBreakDuration,
    focusDuration,
    onFocusComplete,
    preferences.notificationsEnabled,
  ])

  const formatTime = (value: number) =>
    `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`

  const chooseDuration = (minutes: number) => {
    if (isRunning || mode !== 'Focus') return

    setFocusMinutes(minutes)
    setSeconds(minutes * 60)
    setEndsAt(null)
  }

  const startTimer = () => {
    if (mode === 'Focus' && seconds === 0) {
      setSeconds(focusDuration)
    }

    if (
      preferences.notificationsEnabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      void requestNotificationPermission()
    }

    const remaining = mode === 'Focus' && seconds === 0
      ? focusDuration
      : seconds

    setEndsAt(Date.now() + remaining * 1000)
    setIsRunning(true)
  }

  const pauseTimer = () => {
    if (endsAt !== null) {
      setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }

    setEndsAt(null)
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMode('Focus')
    setSeconds(focusDuration)
    setEndsAt(null)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex-col items-center justify-center overflow-y-auto bg-cover bg-center px-5 py-10 ${
        isVisible ? 'flex' : 'hidden'
      }`}
      style={{
        backgroundImage: `linear-gradient(#10120d99, #10120dcc), url("${background}")`,
      }}
    >
      <button
        onClick={onExit}
        className="absolute left-6 top-6 text-sm text-white/80 hover:text-white"
      >
        ← Back
      </button>

      <div className="mb-6 text-center">
        <p className="text-xs tracking-[0.3em] text-white/70">QUIETHOURS</p>
        <h2 className="mt-3 text-2xl font-medium text-white">
          {mode === 'Focus' ? 'Find your quiet.' : 'Take a breath.'}
        </h2>
      </div>

      {selectedTask && (
        <div className="mb-6 w-full max-w-sm rounded-xl border border-white/25 bg-black/30 px-5 py-4 text-center backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            CURRENTLY WORKING ON
          </p>
          <p className="mt-2 break-words text-sm font-medium text-white">
            {selectedTask}
          </p>
          <button
            onClick={onClearTask}
            className="mt-2 text-xs text-white/60 underline hover:text-white"
          >
            Clear task
          </button>
        </div>
      )}

      <div className="flex h-72 w-72 items-center justify-center rounded-full border border-white/40 bg-black/25 shadow-2xl backdrop-blur-sm sm:h-80 sm:w-80">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">
            {mode}
          </p>
          <p className="mt-3 text-6xl font-light tracking-tight text-white tabular-nums sm:text-7xl">
            {formatTime(seconds)}
          </p>
          <p className="mt-3 text-xs text-white/60">
            {completedSessions} sessions completed
          </p>
        </div>
      </div>

      <div className="mt-7 text-center">
        <p className="mb-3 text-xs text-white/70">FOCUS DURATION</p>

        <div className="flex flex-wrap justify-center gap-2">
          {[15, 25, 30, 45, 60].map(minutes => (
            <button
              key={minutes}
              disabled={isRunning || mode !== 'Focus'}
              onClick={() => {
                setUseCustom(false)
                chooseDuration(minutes)
              }}
              className={`rounded-full border px-4 py-2 text-xs transition ${
                !useCustom && focusMinutes === minutes
                  ? 'border-white bg-white text-[#171816]'
                  : 'border-white/30 bg-black/20 text-white'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {minutes} min
            </button>
          ))}

          <button
            disabled={isRunning || mode !== 'Focus'}
            onClick={() => {
              setUseCustom(true)
              const value = Number(customMinutes)
              if (value >= 1 && value <= 180) chooseDuration(value)
            }}
            className={`rounded-full border px-4 py-2 text-xs ${
              useCustom
                ? 'border-white bg-white text-[#171816]'
                : 'border-white/30 bg-black/20 text-white'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Custom
          </button>
        </div>

        {useCustom && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              disabled={isRunning || mode !== 'Focus'}
              onChange={event => {
                const value = event.target.value
                setCustomMinutes(value)
                const minutes = Number(value)
                if (minutes >= 1 && minutes <= 180) chooseDuration(minutes)
              }}
              className="w-20 rounded-lg border border-white/30 bg-black/40 px-3 py-2 text-center text-sm text-white outline-none"
            />
            <span className="text-xs text-white/70">minutes</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className="min-w-32 rounded-full bg-[#e9e2d5] px-9 py-3 text-sm font-medium text-[#171816] hover:bg-white"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={resetTimer}
          className="rounded-full border border-white/40 bg-black/20 px-7 py-3 text-sm text-white hover:bg-black/40"
        >
          Reset
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-white/65">
        {mode === 'Focus'
          ? `Breaks are automatic · Next break: ${
              completedSessions % 4 === 3
                ? preferences.longBreakDuration
                : preferences.shortBreakDuration
            } minutes`
          : 'Your next focus session will be ready after this break.'}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setShowBackgrounds(!showBackgrounds)}
          className="rounded-lg border border-white/25 bg-black/30 px-5 py-3 text-sm text-white hover:bg-black/50"
        >
          ▧ Background
        </button>
      </div>

      {showBackgrounds && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {backgrounds.map(item => (
            <button
              key={item.name}
              onClick={() => {
                setBackground(item.url)
                setShowBackgrounds(false)
              }}
              className="rounded-lg border border-white/30 bg-black/50 px-4 py-2 text-xs text-white hover:bg-black/70"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 w-full max-w-xl">
        <LoFiPlayer />
      </div>
    </div>
  )
}

function HomePage({ activePage, onNavigate }: HomePageProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(
    () => loadTimerState()?.selectedTask ?? null
  )
  const [goalRefreshKey, setGoalRefreshKey] = useState(0)

  const handleFocusComplete = useCallback(() => {
    setGoalRefreshKey(value => value + 1)
  }, [])

  const pageDescriptions: Record<Page, string> = {
    Overview: 'A calmer way to get things done.',
    Focus: 'Make space for uninterrupted work.',
    'My Tasks': 'Keep your daily priorities in one place.',
    Statistics: 'See the progress you make over time.',
    History: 'Look back at your completed focus sessions.',
    Settings: 'Make QuietHours feel like your own.',
  }

  const startTask = (title: string) => {
    setSelectedTask(title)
    onNavigate('Focus')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#171816] text-[#e9e2d5]">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#383832] bg-[#1b1c19]/95 px-5 py-4 backdrop-blur md:hidden">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            QuietHours<span className="text-[#899477]">.</span>
          </h1>
          <p className="mt-1 text-[10px] tracking-widest text-[#aaa295]">
            YOUR SPACE TO FOCUS
          </p>
        </div>

        <button
          onClick={() => onNavigate('Settings')}
          aria-label="Settings"
          className="rounded-lg border border-[#383832] p-3 text-[#aaa295] hover:text-white"
        >
          ⚙
        </button>
      </header>

      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-[#383832] bg-[#1b1c19] p-6 md:flex">
          <div className="mb-12">
            <h1 className="text-xl font-semibold tracking-tight">
              QuietHours<span className="text-[#899477]">.</span>
            </h1>
            <p className="mt-1 text-xs tracking-wide text-[#aaa295]">
              YOUR SPACE TO FOCUS
            </p>
          </div>

          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#77776e]">
            Your Space
          </p>

          <nav className="flex flex-col gap-2">
            {navigation.map(item => (
              <button
                key={item}
                onClick={() => onNavigate(item)}
                aria-current={activePage === item ? 'page' : undefined}
                className={`rounded-md px-3 py-3 text-left text-sm transition-colors ${
                  activePage === item
                    ? 'bg-[#292a25] text-[#e9e2d5]'
                    : 'text-[#aaa295] hover:bg-[#252620] hover:text-[#e9e2d5]'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <button
            onClick={() => onNavigate('Settings')}
            className={`mt-5 flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors ${
              activePage === 'Settings'
                ? 'bg-[#292a25] text-[#e9e2d5]'
                : 'text-[#aaa295] hover:bg-[#252620] hover:text-[#e9e2d5]'
            }`}
          >
            <span>⚙</span>
            Settings
          </button>

          <div className="mt-auto border-t border-[#383832] pt-5">
            <p className="text-xs text-[#77776e]">A little more focus.</p>
            <p className="mt-1 text-sm text-[#aaa295]">
              A little less noise.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-7 sm:px-7 md:ml-56 md:px-9 md:py-10 md:pb-12 lg:px-12">
          <div className="mx-auto w-full max-w-7xl">
            <header className="mb-8 md:mb-9">
              <p className="text-[10px] font-medium tracking-[0.22em] text-[#899477]">
                YOUR SPACE
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                {activePage === 'Overview'
                  ? 'Welcome to QuietHours.'
                  : activePage}
              </h2>
              <p className="mt-2 text-sm text-[#aaa295]">
                {pageDescriptions[activePage]}
              </p>
            </header>

            {activePage === 'Overview' && (
              <div className="space-y-7 md:space-y-8">
                {/* Hero */}
                <section className="grid overflow-hidden rounded-2xl border border-[#383832] bg-[#20211e] md:min-h-[300px] md:grid-cols-[1.05fr_0.95fr]">
                  <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#899477]">
                      MAKE TIME FOR WHAT MATTERS
                    </p>
                    <h3 className="mt-4 max-w-xl text-[2rem] font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]">
                      Find your rhythm.
                      <br />
                      One task at a time.
                    </h3>
                    <p className="mt-4 max-w-md text-sm leading-6 text-[#aaa295] sm:leading-7">
                      A peaceful space to focus on your goals,
                      build consistency and make meaningful progress.
                    </p>
                  </div>

                  <div className="relative h-44 min-h-[176px] sm:h-56 md:h-full md:min-h-[300px]">
                    <img
                      src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1600&q=85"
                      alt="A warm, peaceful study environment"
                      className="absolute inset-0 h-full w-full object-cover opacity-75"
                    />
                  </div>
                </section>

                <DailyGoal refreshKey={goalRefreshKey} />

                {/* Workspace */}
                <section>
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
                      YOUR WORKSPACE
                    </p>
                    <h3 className="mt-2 text-xl font-medium">
                      What would you like to do?
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      onClick={() => onNavigate('Focus')}
                      className="rounded-xl border border-[#383832] bg-[#20211e] p-5 text-left transition-colors hover:border-[#77765e] sm:p-6"
                    >
                      <p className="text-xs uppercase tracking-widest text-[#899477]">
                        FOCUS
                      </p>
                      <h4 className="mt-5 text-xl font-medium sm:text-2xl">
                        Time to concentrate.
                      </h4>
                      <p className="mt-3 text-sm leading-6 text-[#aaa295]">
                        Start a focused study session and give your attention to one thing.
                      </p>
                      <p className="mt-7 text-sm text-[#e9e2d5]">
                        Open Focus →
                      </p>
                    </button>

                    <button
                      onClick={() => onNavigate('My Tasks')}
                      className="rounded-xl border border-[#383832] bg-[#20211e] p-5 text-left transition-colors hover:border-[#77765e] sm:p-6"
                    >
                      <p className="text-xs uppercase tracking-widest text-[#899477]">
                        DAILY PLANNING
                      </p>
                      <h4 className="mt-5 text-xl font-medium sm:text-2xl">
                        Organise your day.
                      </h4>
                      <p className="mt-3 text-sm leading-6 text-[#aaa295]">
                        Keep your study goals organised and know what needs your attention.
                      </p>
                      <p className="mt-7 text-sm text-[#e9e2d5]">
                        Open My Tasks →
                      </p>
                    </button>
                  </div>
                </section>

                {/* Progress */}
                <section className="rounded-xl border border-[#383832] bg-[#20211e] p-5 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
                    YOUR PROGRESS
                  </p>
                  <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-xl font-medium">
                        Your journey starts here.
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#aaa295]">
                        Your study statistics will appear here as you complete focus sessions.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('Statistics')}
                      className="shrink-0 text-left text-sm text-[#c5c3a7] hover:text-[#e9e2d5]"
                    >
                      View Statistics →
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activePage === 'My Tasks' && (
              <TaskManager onStartTask={startTask} />
            )}

            {activePage === 'Statistics' && <Statistics />}

            {activePage === 'History' && <SessionHistory />}

            {activePage === 'Settings' && <Settings />}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#383832] bg-[#1b1c19]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navigation.map(item => (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              aria-current={activePage === item ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                activePage === item
                  ? 'bg-[#292a25] text-[#e9e2d5]'
                  : 'text-[#aaa295] hover:bg-[#252620]'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {item === 'Overview'
                  ? '⌂'
                  : item === 'Focus'
                    ? '◷'
                    : item === 'My Tasks'
                      ? '☷'
                      : item === 'Statistics'
                        ? '▥'
                        : '↺'}
              </span>
              <span className="truncate">
                {item === 'My Tasks' ? 'Tasks' : item}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <FocusTimer
        isVisible={activePage === 'Focus'}
        selectedTask={selectedTask}
        onClearTask={() => setSelectedTask(null)}
        onExit={() => onNavigate('Overview')}
        onFocusComplete={handleFocusComplete}
      />
    </div>
  )
}

export default HomePage
