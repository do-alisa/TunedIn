"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type SliderScores = {
  lyricsScore: number | null
  productionScore: number | null
  replayScore: number | null
  emotionScore: number | null
}

type Review = SliderScores & {
  id: string
  rating: number
  isLoved: boolean
  notes: string | null
  createdAt: Date
  album: {
    title: string
    artistName: string
    coverUrl: string | null
    genres: string[]
  }
}

type User = {
  id: string
  name: string | null
  image: string | null
  username: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const full = rating >= star
        const half = !full && rating >= star - 0.5
        return (
          <svg key={star} viewBox="0 0 24 24" className="w-4 h-4">
            <defs>
              <linearGradient id={"half-" + star + "-" + rating}>
                <stop offset="50%" stopColor="#eac54f"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={full ? "#eac54f" : half ? `url(#half-${star}-${rating})` : "none"}
              stroke={full || half ? "#eac54f" : "#52525b"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
      <span className="ml-1 text-zinc-400 text-xs">{rating}/5</span>
    </div>
  )
}

export default function ProfileClient({ user, reviews }: { user: User; reviews: Review[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "loved">("all")
  const [sort, setSort] = useState<"recent" | "rating">("recent")

  const loved = reviews.filter(r => r.isLoved).length
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—"

  const filtered = reviews
    .filter(r => filter === "all" || r.isLoved)
    .sort((a, b) => sort === "rating" ? b.rating - a.rating : 0)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto p-8">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/feed" className="text-zinc-500 hover:text-white text-sm transition-colors">
            ← Back to search
          </Link>
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          {user.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
              {user.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.username && <p className="text-zinc-500 text-sm">@{user.username}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Reviews", value: reviews.length },
            { label: "Loved", value: loved },
            { label: "Avg Rating", value: avgRating },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-zinc-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {(["all", "loved"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={"text-sm px-4 py-1.5 rounded-full transition-colors " +
                  (filter === f ? "bg-white text-black font-medium" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
                {f === "all" ? "All Reviews" : "Loved"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["recent", "rating"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={"text-xs px-3 py-1 rounded-full transition-colors " +
                  (sort === s ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}>
                {s === "recent" ? "Recent" : "Top Rated"}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id}
                className="bg-zinc-900 hover:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-colors"
                onClick={() => router.push(`/review/${r.id}`)}>
                <div className="flex items-center gap-4 p-4">
                  {r.album.coverUrl ? (
                    <img src={r.album.coverUrl} alt={r.album.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.album.title}</p>
                    <p className="text-zinc-400 text-sm truncate">{r.album.artistName}</p>
                    <div className="mt-1">
                      <StarRating rating={r.rating} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {r.isLoved && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    )}
                    <span className="text-zinc-400 text-xs">→</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
