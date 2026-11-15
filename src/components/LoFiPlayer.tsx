
import { useEffect, useRef, useState } from 'react'
import {
  playlists,
  fetchMusicTracks,
  type MusicTrack,
} from '../utils/music'

function LoFiPlayerContent() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [selectedPlaylist, setSelectedPlaylist] = useState(playlists[0].name)
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState(50)
  const [error, setError] = useState('')

  const currentTrack = tracks[currentIndex]

  useEffect(() => {
    let cancelled = false

    async function loadTracks() {
      setLoading(true)
      setError('')
      setIsPlaying(false)
      setTracks([])
      setCurrentIndex(0)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
      }

      const playlist = playlists.find(
        item => item.name === selectedPlaylist
      )

      if (!playlist) {
        setLoading(false)
        return
      }

      try {
        const result = await fetchMusicTracks(playlist.query)

        if (cancelled) return

        setTracks(result)

        if (result.length === 0) {
          setError('No tracks found in this playlist.')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load music.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTracks()

    return () => {
      cancelled = true
    }
  }, [selectedPlaylist])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !currentTrack) return

    audio.pause()
    audio.src = currentTrack.audioUrl
    audio.volume = volume / 100

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false)
        setError('Playback failed. Try another track.')
      })
    }
  }, [currentTrack, isPlaying])

  const togglePlayback = async () => {
    const audio = audioRef.current

    if (!audio || !currentTrack) return

    setError('')

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        audio.volume = volume / 100
        await audio.play()
        setIsPlaying(true)
      } catch {
        setError('Unable to play this track. Try another one.')
      }
    }
  }

  const changeTrack = (direction: number) => {
    if (tracks.length === 0) return

    setCurrentIndex(current =>
      (current + direction + tracks.length) % tracks.length
    )
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)

    if (audioRef.current) {
      audioRef.current.volume = value / 100
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return (
    <section className="rounded-xl border border-[#383832] bg-[#20211e] p-6 sm:p-8">
      <audio
        ref={audioRef}
        onEnded={() => changeTrack(1)}
        onError={() => {
          setIsPlaying(false)
          setError('This track could not be played.')
        }}
      />

      <p className="text-xs uppercase tracking-[0.2em] text-[#899477]">
        QUIETHOURS AUDIO
      </p>

      <h3 className="mt-2 text-xl font-medium text-[#e9e2d5]">
        Lo-fi player
      </h3>

      <div className="mt-6">
        <label className="mb-2 block text-sm text-[#e9e2d5]">
          Choose a playlist
        </label>

        <select
          value={selectedPlaylist}
          onChange={event => setSelectedPlaylist(event.target.value)}
          className="w-full rounded-lg border border-[#383832] bg-[#292a25] px-4 py-3 text-sm text-[#e9e2d5] outline-none"
        >
          {playlists.map(playlist => (
            <option key={playlist.name} value={playlist.name}>
              {playlist.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-lg bg-[#292a25] p-5">
        <p className="text-xs text-[#899477]">NOW PLAYING</p>

        {loading ? (
          <p className="mt-4 text-sm text-[#aaa295]">
            Finding your music...
          </p>
        ) : currentTrack ? (
          <>
            <div className="mt-4 flex items-center gap-4">
              {currentTrack.artworkUrl && (
                <img
                  src={currentTrack.artworkUrl}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}

              <div className="min-w-0">
                <h4 className="truncate text-lg font-medium text-[#e9e2d5]">
                  {currentTrack.title}
                </h4>
                <p className="mt-1 truncate text-sm text-[#aaa295]">
                  {currentTrack.artist}
                </p>
                <p className="mt-1 text-xs text-[#77776e]">
                  {formatDuration(currentTrack.duration)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-7">
              <button
                onClick={() => changeTrack(-1)}
                aria-label="Previous track"
                className="text-xl text-[#aaa295] hover:text-white"
              >
                ◀
              </button>

              <button
                onClick={togglePlayback}
                aria-label={isPlaying ? 'Pause music' : 'Play music'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#899477] text-xl text-[#171816]"
              >
                {isPlaying ? 'Ⅱ' : '▶'}
              </button>

              <button
                onClick={() => changeTrack(1)}
                aria-label="Next track"
                className="text-xl text-[#aaa295] hover:text-white"
              >
                ▶
              </button>
            </div>

            <p className="mt-5 text-center text-xs text-[#77776e]">
              Track {currentIndex + 1} of {tracks.length}
            </p>

            <p className="mt-4 text-center text-xs text-[#aaa295]">
              Music by{' '}
              <a
                href={currentTrack.attributionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#c5c3a7] underline"
              >
                {currentTrack.artist} · Free To Use
              </a>
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-[#aaa295]">
            {error || 'No music available.'}
          </p>
        )}

        {error && currentTrack && (
          <p className="mt-4 text-center text-xs text-red-300">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm">
          <label htmlFor="music-volume" className="text-[#e9e2d5]">
            Volume
          </label>
          <span className="text-[#aaa295]">{volume}%</span>
        </div>

        <input
          id="music-volume"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={event =>
            handleVolumeChange(Number(event.target.value))
          }
          className="mt-3 w-full accent-[#899477]"
        />
      </div>

      <p className="mt-5 text-xs text-[#77776e]">
        Music provided by Free To Use.
      </p>
    </section>
  )
}

function LoFiPlayer() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-xl border border-[#383832] bg-[#20211e] px-5 py-4 text-left transition hover:border-[#77765e]"
      >
        <div>
          <p className="text-sm font-medium text-[#e9e2d5]">
            ♫ Lo-fi music
          </p>
          <p className="mt-1 text-xs text-[#aaa295]">
            Background music for your focus session
          </p>
        </div>

        <span className="text-[#aaa295]">
          {expanded ? '⌃' : '⌄'}
        </span>
      </button>

      {expanded && (
        <div className="mt-3">
          <LoFiPlayerContent />
        </div>
      )}
    </div>
  )
}

export default LoFiPlayer
