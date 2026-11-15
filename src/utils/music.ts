
const API_BASE = '/api/music'

export interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: number
  audioUrl: string
  artworkUrl: string | null
  attributionUrl: string
}

interface ApiTrack {
  id: string
  title: string
  artists?: [number, { name: string }][]
  duration: number
  is_premium: boolean
  files?: {
    mp3?: string
  }
  thumbnails?: {
    md?: string
  }
}

interface ApiResponse {
  ok: boolean
  data: ApiTrack[]
  error?: string
}

export const playlists = [
  { name: 'Rainy Day', query: 'lofi' },
  { name: 'Deep Focus', query: 'piano' },
  { name: 'Cozy Evening', query: 'chill' },
]

export async function fetchMusicTracks(
  query: string
): Promise<MusicTrack[]> {
  const params = new URLSearchParams({ query })

  const response = await fetch(`${API_BASE}?${params}`)

  if (!response.ok) {
    throw new Error(`Music API error: ${response.status}`)
  }

  const result: ApiResponse = await response.json()

  if (!result.ok || !Array.isArray(result.data)) {
    throw new Error(result.error || 'Invalid music response.')
  }

  return result.data
    .filter(track => !track.is_premium && Boolean(track.files?.mp3))
    .map(track => ({
      id: String(track.id),
      title: track.title,
      artist:
        track.artists
          ?.map(([, artist]) => artist.name)
          .join(', ') || 'Unknown artist',
      duration: track.duration,
      audioUrl: track.files!.mp3!,
      artworkUrl: track.thumbnails?.md ?? null,
      attributionUrl: 'https://freetouse.com/',
    }))
}
