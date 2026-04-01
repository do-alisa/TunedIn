import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function FeedPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold">Welcome, {session.user.name} 🎵</h1>
      <p className="text-zinc-400 mt-2">Your feed is being built...</p>
    </main>
  )
}