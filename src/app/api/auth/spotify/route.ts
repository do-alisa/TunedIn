import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import crypto from "node:crypto"

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ")

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: "http://127.0.0.1:3000/api/auth/callback/spotify",
    state,
    show_dialog: "true",
  })

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  )
}