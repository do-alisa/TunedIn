import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

async function getToken(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: "spotify" } })
  return account?.access_token ?? null
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session-token")?.value
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await prisma.session.findUnique({ where: { sessionToken } })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const token = await getToken(session.userId)
  if (!token) return NextResponse.json({ error: "No Spotify token" }, { status: 401 })

  // Tracklist fetch
  const tracklistId = request.nextUrl.searchParams.get("tracklist")
  if (tracklistId) {
    const res = await fetch(
      `https://api.spotify.com/v1/albums/${tracklistId}/tracks?limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return NextResponse.json({ tracks: data.items ?? [] })
  }

  // Album search
  const query = request.nextUrl.searchParams.get("q")
  if (!query) return NextResponse.json({ albums: [] })

  const params = new URLSearchParams({ q: query, type: "album", limit: "10", market: "US" })
  const res = await fetch(
    `https://api.spotify.com/v1/search?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  if (data.error) return NextResponse.json({ error: data.error.message, albums: [] })
  return NextResponse.json({ albums: data.albums?.items ?? [] })
}
