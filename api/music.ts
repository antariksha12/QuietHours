
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Method not allowed',
    })
  }

  const query = request.query.query

  if (typeof query !== 'string' || !query.trim() || query.length > 100) {
    return response.status(400).json({
      error: 'A valid search query is required.',
    })
  }

  try {
    const params = new URLSearchParams({
      query,
      limit: '30',
      order: 'plays',
      sort: 'desc',
    })

    const upstream = await fetch(
      `https://api.freetouse.com/v3/music/tracks/search?${params}`
    )

    const data = await upstream.json()

    return response
      .status(upstream.status)
      .setHeader('Cache-Control', 'public, s-maxage=300')
      .json(data)
  } catch {
    return response.status(502).json({
      error: 'Unable to contact the music provider.',
    })
  }
}
