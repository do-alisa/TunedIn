import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import crypto from "node:crypto"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect("http://127.0.0.1:3000/login?error=spotify")
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://127.0.0.1:3000/api/auth/callback/spotify",
    }),
  })

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text())
    return NextResponse.redirect("http://127.0.0.1:3000/login?error=token")
  }

  const tokens = await tokenRes.json()

  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await profileRes.json()

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      name: profile.display_name,
      image: profile.images?.[0]?.url,
      spotifyId: profile.id,
    },
    create: {
      email: profile.email,
      name: profile.display_name,
      image: profile.images?.[0]?.url,
      spotifyId: profile.id,
      username: profile.id,
    },
  })

  const sessionToken = crypto.randomBytes(32).toString("hex")

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Store spotify access token separately
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "spotify",
        providerAccountId: profile.id,
      },
    },
    update: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "spotify",
      providerAccountId: profile.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set("session-token", sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })

  return NextResponse.redirect("http://127.0.0.1:3000/feed")
}
