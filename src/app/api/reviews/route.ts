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

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { spotifyAlbumId, title, artistName, coverUrl, releaseYear, rating, isLoved, notes, lyricsScore, productionScore, replayScore, emotionScore } = body

  // Upsert album
  const album = await prisma.album.upsert({
    where: { spotifyAlbumId },
    update: {},
    create: { spotifyAlbumId, title, artistName, coverUrl, releaseYear: releaseYear ?? null, genres: [] },
  })

  // Upsert review
  const review = await prisma.albumReview.upsert({
    where: { userId_albumId: { userId: user.id, albumId: album.id } },
    update: { rating, isLoved, notes, lyricsScore, productionScore, replayScore, emotionScore },
    create: { userId: user.id, albumId: album.id, rating, isLoved: isLoved ?? false, notes, lyricsScore, productionScore, replayScore, emotionScore },
  })

  return NextResponse.json({ review })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const reviews = await prisma.albumReview.findMany({
    where: { userId: user.id, isVisible: true },
    include: { album: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ reviews })
}
