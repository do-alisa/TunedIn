import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session-token")?.value
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  })
  return session ?? null
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { minRating, playlistName } = await request.json()

  const account = await prisma.account.findFirst({
    where: { userId: session.userId, provider: "spotify" },
  })
  if (!account?.access_token) {
    return NextResponse.json({ error: "No Spotify token — please log in again" }, { status: 401 })
  }

  // Get track ratings above the minimum
  const trackRatings = await prisma.trackRating.findMany({
    where: {
      userId: session.userId,
      rating: { gte: minRating ?? 0 },
    },
    include: { track: true },
    orderBy: { rating: "desc" },
  })

  if (trackRatings.length === 0) {
    return NextResponse.json({
      error: `No tracks rated ${minRating}+ stars yet. Rate some tracks when reviewing albums first!`
    }, { status: 400 })
  }

  // Build Spotify track URIs
  const trackUris = trackRatings.map(r => `spotify:track:${r.track.spotifyTrackId}`)

  // Get Spotify user ID
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${account.access_token}` },
  })
  const me = await meRes.json()

  // Create Spotify playlist
  const createRes = await fetch(
    `https://api.spotify.com/v1/me/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName || `TunedIn: ${minRating}+ star tracks`,
        description: `${trackRatings.length} tracks rated ${minRating}+ stars on TunedIn`,
        public: false,
      }),
    }
  )
  const playlist = await createRes.json()

  if (!playlist.id) {
    console.error('Spotify create playlist error:', JSON.stringify(playlist))
    return NextResponse.json({ error: "Failed to create Spotify playlist", detail: playlist }, { status: 500 })
  }

  // Add tracks in batches of 100
  for (let i = 0; i < trackUris.length; i += 100) {
    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: trackUris.slice(i, i + 100) }),
    })
  }

  // Save to database
  await prisma.playlist.create({
    data: {
      userId: session.userId,
      title: playlistName || `TunedIn: ${minRating}+ star tracks`,
      sourceGenres: [],
      minRating: minRating ?? 0,
      spotifyPlaylistId: playlist.id,
    },
  })

  return NextResponse.json({
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls?.spotify,
    trackCount: trackUris.length,
  })
}
