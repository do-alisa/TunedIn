import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import ProfileClient from "./ProfileClient"

const prisma = new PrismaClient()

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [reviews, trackRatings] = await Promise.all([
    prisma.albumReview.findMany({
      where: { userId: session.user.id, isVisible: true },
      include: { album: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trackRating.findMany({
      where: { userId: session.user.id },
      include: { track: { include: { album: true } } },
      orderBy: { rating: "desc" },
    }),
  ])

  const serializedReviews = reviews.map(r => ({
    ...r,
    listenedAt: r.listenedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const serializedTrackRatings = trackRatings.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    track: { ...r.track, album: r.track.album },
  }))

  return (
    <ProfileClient
      user={session.user}
      reviews={serializedReviews}
      trackRatings={serializedTrackRatings}
    />
  )
}
