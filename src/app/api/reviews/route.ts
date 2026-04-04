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
  const {
    spotifyAlbumId, title, artistName, coverUrl, releaseYear,
    rating, isLoved, notes, lyricsScore, productionScore,
    replayScore, emotionScore, listenedAt,
  } = body

  const album = await prisma.album.upsert({
    where: { spotifyAlbumId },
    update: {},
    create: {
      spotifyAlbumId, title, artistName,
      coverUrl, releaseYear: releaseYear ?? null, genres: [],
    },
  })

  let review = null
  if (rating && rating > 0) {
    review = await prisma.albumReview.create({
      data: {
        userId: user.id,
        albumId: album.id,
        rating,
        isLoved: isLoved ?? false,
        notes,
        lyricsScore,
        productionScore,
        replayScore,
        emotionScore,
        listenedAt: listenedAt ? new Date(listenedAt + "T12:00:00") : new Date(),
      },
    })
  }

  return NextResponse.json({ review, albumDbId: album.id })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const reviews = await prisma.albumReview.findMany({
    where: { userId: user.id },
    include: { album: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ reviews })
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await request.json()

  const review = await prisma.albumReview.findUnique({ where: { id } })
  if (!review || review.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.albumReview.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
