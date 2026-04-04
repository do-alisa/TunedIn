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

  const trackRatings = await prisma.trackRating.findMany({
    where: {
      userId: session.userId,
      rating: { gte: minRating ?? 0 },
    },
    include: { track: true },
    orderBy: { createdAt: "desc" },
  })

  if (trackRatings.length === 0) {
    return NextResponse.json({
      error: `No tracks rated ${minRating}+ stars yet. Rate some tracks when reviewing albums first!`
    }, { status: 400 })
  }

  const tracks = trackRatings.map(r => ({
    title: r.track.title,
    spotifyTrackId: r.track.spotifyTrackId,
    rating: r.rating,
    spotifyUrl: `https://open.spotify.com/track/${r.track.spotifyTrackId}`,
  }))

  // Save to database for history
  await prisma.playlist.create({
    data: {
      userId: session.userId,
      title: playlistName || `TunedIn: ${minRating}+ star tracks`,
      sourceGenres: [],
      minRating: minRating ?? 0,
    },
  })

  return NextResponse.json({
    tracks,
    trackCount: tracks.length,
    playlistName: playlistName || `TunedIn: ${minRating}+ star tracks`,
  })
}
