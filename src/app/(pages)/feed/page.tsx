import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import FeedClient from "./FeedClient"

export default async function FeedPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <FeedClient userName={session.user.name ?? "there"} />
}
