import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session-token")?.value
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await prisma.session.findUnique({ where: { sessionToken } })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const query = request.nextUrl.searchParams.get("q")
  if (!query) return NextResponse.json({ albums: [] })

  const account = await prisma.account.findFirst({ where: { userId: session.userId, provider: "spotify" } })
  if (!account?.access_token) return NextResponse.json({ error: "No spotify token" }, { status: 401 })

  const params = new URLSearchParams({
    q: query,
    type: "album",
    limit: "10",
    market: "US",
  })

  const spotifyRes = await fetch(
    `https://api.spotify.com/v1/search?${params}`,
    { headers: { Authorization: `Bearer ${account.access_token}` } }
  )

  const data = await spotifyRes.json()

  if (data.error) {
    console.error("Spotify error:", JSON.stringify(data.error))
    return NextResponse.json({ error: data.error.message, albums: [] })
  }

  return NextResponse.json({ albums: data.albums?.items ?? [] })
}
