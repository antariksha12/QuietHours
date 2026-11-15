
import { useState } from 'react'
import { requestNotificationPermission } from '../utils/notifications'

export interface UserSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  notificationsEnabled: boolean
  soundEnabled: boolean
}

const STORAGE_KEY = 'quiethours-settings'

export const defaultSettings: UserSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  notificationsEnabled: false,
  soundEnabled: true,
}

export function getUserSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return defaultSettings

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    }
  } catch {
    return defaultSettings
  }
}

export function saveUserSettings(settings: UserSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function Settings() {
  const [settings, setSettings] = useState<UserSettings>(getUserSettings)

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveUserSettings(updated)
  }

  const handleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission()
      updateSetting('notificationsEnabled', granted)
    } else {
      updateSetting('notificationsEnabled', false)
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-7">
      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          FOCUS PREFERENCES
        </p>

        <h3 className="mt-2 text-xl font-medium">
          Timer durations
        </h3>

        <p className="mt-2 text-sm text-[#aaa295]">
          Choose your preferred session and break lengths.
        </p>

        <div className="mt-7 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-[#e9e2d5]">
              Default focus duration
            </label>
            <select
              value={settings.focusDuration}
              onChange={event =>
                updateSetting('focusDuration', Number(event.target.value))
              }
              className="w-full rounded-lg border border-[#383832] bg-[#292a25] px-4 py-3 text-sm text-[#e9e2d5] outline-none focus:border-[#899477]"
            >
              {[15, 25, 30, 45, 60].map(value => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#e9e2d5]">
              Short break
            </label>
            <select
              value={settings.shortBreakDuration}
              onChange={event =>
                updateSetting('shortBreakDuration', Number(event.target.value))
              }
              className="w-full rounded-lg border border-[#383832] bg-[#292a25] px-4 py-3 text-sm text-[#e9e2d5] outline-none focus:border-[#899477]"
            >
              {[5, 10, 15].map(value => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#e9e2d5]">
              Long break
            </label>
            <select
              value={settings.longBreakDuration}
              onChange={event =>
                updateSetting('longBreakDuration', Number(event.target.value))
              }
              className="w-full rounded-lg border border-[#383832] bg-[#292a25] px-4 py-3 text-sm text-[#e9e2d5] outline-none focus:border-[#899477]"
            >
              {[10, 15, 20, 25, 30].map(value => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          NOTIFICATIONS
        </p>

        <h3 className="mt-2 text-xl font-medium">
          Stay informed
        </h3>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#e9e2d5]">
              Browser notifications
            </p>
            <p className="mt-1 text-xs text-[#aaa295]">
              Get notified when a session or break finishes.
            </p>
          </div>

          <button
            onClick={handleNotifications}
            role="switch"
            aria-checked={settings.notificationsEnabled}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              settings.notificationsEnabled
                ? 'bg-[#899477]'
                : 'bg-[#494a43]'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                settings.notificationsEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {settings.notificationsEnabled && (
          <p className="mt-4 text-xs text-[#899477]">
            Browser notifications are enabled.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
          AUDIO
        </p>

        <h3 className="mt-2 text-xl font-medium">
          Sound preferences
        </h3>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#e9e2d5]">
              Enable audio
            </p>
            <p className="mt-1 text-xs text-[#aaa295]">
              Allow QuietHours to play music and sounds.
            </p>
          </div>

          <button
            onClick={() =>
              updateSetting('soundEnabled', !settings.soundEnabled)
            }
            role="switch"
            aria-checked={settings.soundEnabled}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              settings.soundEnabled
                ? 'bg-[#899477]'
                : 'bg-[#494a43]'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                settings.soundEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </section>

      <p className="text-xs text-[#77776e]">
        Your preferences are saved automatically on this device.
      </p>

      {/* Studio footer */}
      <footer className="border-t border-[#383832] pt-7 text-center">
        <p className="text-sm font-semibold tracking-wide text-[#e9e2d5]">
          AntS Studio<span className="text-[#899477]">.</span>
        </p>

        <p className="mt-2 text-xs text-[#77776e]">
          Crafted with care.
        </p>

        <a
          href="mailto:antariksha490@gmail.com"
          className="mt-3 inline-block text-xs text-[#aaa295] transition hover:text-[#899477]"
        >
          antariksha490@gmail.com
        </a>

        <p className="mt-5 text-[10px] text-[#626259]">
          © {new Date().getFullYear()} AntS Studio. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default Settings
