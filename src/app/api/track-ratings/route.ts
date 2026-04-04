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
  return session?.user ?? null
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ratings = await prisma.trackRating.findMany({
    where: { userId: user.id },
    include: { track: { include: { album: true } } },
    orderBy: { rating: "desc" },
  })

  return NextResponse.json({ ratings })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tracks, albumId } = await request.json()
  const results = []

  for (const t of tracks) {
    if (!t.rating) continue
    const track = await prisma.track.upsert({
      where: { spotifyTrackId: t.spotifyTrackId },
      update: {},
      create: {
        spotifyTrackId: t.spotifyTrackId,
        albumId,
        title: t.title,
        trackNumber: t.trackNumber,
        durationMs: t.durationMs,
      },
    })
    const rating = await prisma.trackRating.upsert({
      where: { userId_trackId: { userId: user.id, trackId: track.id } },
      update: { rating: t.rating },
      create: { userId: user.id, trackId: track.id, rating: t.rating },
    })
    results.push(rating)
  }

  return NextResponse.json({ saved: results.length })
}
