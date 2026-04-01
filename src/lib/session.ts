import { cookies } from "next/headers"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session-token")?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  })

  if (!session || session.expires < new Date()) return null
  return session
}