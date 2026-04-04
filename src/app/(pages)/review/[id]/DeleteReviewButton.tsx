"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId }),
    })
    router.push("/profile")
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm">Delete this review?</span>
        <button onClick={handleDelete} disabled={deleting}
          className="text-sm bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button onClick={() => setConfirming(false)}
          className="text-sm text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-sm text-zinc-600 hover:text-red-400 transition-colors">
      Delete review
    </button>
  )
}