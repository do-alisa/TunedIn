import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import ProfileClient from "./ProfileClient"

const prisma = new PrismaClient()

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const reviews = await prisma.albumReview.findMany({
    where: { userId: session.user.id, isVisible: true },
    include: { album: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <ProfileClient
      user={session.user}
      reviews={reviews}
    />
  )
}
