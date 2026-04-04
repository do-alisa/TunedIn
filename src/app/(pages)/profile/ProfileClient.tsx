"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Review = {
  id: string
  rating: number
  isLoved: boolean
  notes: string | null
  lyricsScore: number | null
  productionScore: number | null
  replayScore: number | null
  emotionScore: number | null
  listenedAt: string
  createdAt: string
  album: { title: string; artistName: string; coverUrl: string | null; genres: string[] }
}

type TrackRating = {
  id: string
  rating: number
  createdAt: string
  track: {
    id: string
    title: string
    trackNumber: number | null
    durationMs: number | null
    album: { title: string; artistName: string; coverUrl: string | null }
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
      {[1,2,3,4,5].map(star => {
        const full = rating >= star
        const half = !full && rating >= star - 0.5
        return (
          <svg key={star} viewBox="0 0 24 24" className="w-4 h-4">
            <defs>
              <linearGradient id={"ph" + star + "-" + rating}>
                <stop offset="50%" stopColor="#eac54f"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={full ? "#eac54f" : half ? "url(#ph"+star+"-"+rating+")" : "none"}
              stroke={full || half ? "#eac54f" : "#52525b"}
              strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        )
      })}
      <span className="ml-1 text-zinc-400 text-xs w-8 text-right shrink-0">{rating}/5</span>
    </div>
  )
}

function msToTime(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function matchesFilter(rating: number, filter: string) {
  if (filter === "any") return true
  if (filter.includes("-")) {
    const [min, max] = filter.split("-").map(Number)
    return rating >= min && rating <= max
  }
  return rating === Number(filter)
}

function RatingPicker({ value, onChange, onClose }: {
  value: string
  onChange: (v: string) => void
  onClose: () => void
}) {
  const [hoverVal, setHoverVal] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)

  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

  function getActiveMin() {
    if (value === "any") return 0
    if (value.includes("-")) return Number(value.split("-")[0])
    return Number(value)
  }
  function getActiveMax() {
    if (value === "any") return 0
    if (value.includes("-")) return Number(value.split("-")[1])
    return Number(value)
  }

  function getFill(step: number) {
    const hover = hoverVal
    if (dragStart !== null && hover > 0) {
      const min = Math.min(dragStart, hover)
      const max = Math.max(dragStart, hover)
      return step >= min && step <= max
    }
    if (hover > 0) return step <= hover
    const min = getActiveMin()
    const max = getActiveMax()
    if (min === 0) return false
    // step is the exact half-star value (0.5, 1, 1.5, 2, etc.)
    // a step is filled if it falls within [min, max] inclusive
    return step >= min && step <= max
  }

  function getStarFillType(star: number): "full" | "half" | "none" {
    const fullFilled = getFill(star)
    const halfFilled = getFill(star - 0.5)
    if (fullFilled) return "full"
    if (halfFilled) return "half"
    return "none"
  }

  function handleHalf(star: number, half: "left" | "right") {
    setHoverVal(half === "left" ? star - 0.5 : star)
  }

  function handleDown(star: number, half: "left" | "right") {
    setDragStart(half === "left" ? star - 0.5 : star)
  }

  function handleUp(star: number, half: "left" | "right") {
    const val = half === "left" ? star - 0.5 : star
    if (dragStart !== null && dragStart !== val) {
      const min = Math.min(dragStart, val)
      const max = Math.max(dragStart, val)
      onChange(`${min}-${max}`)
    } else {
      onChange(String(val))
    }
    setDragStart(null)
    onClose()
  }

  return (
    <div className="absolute left-0 top-10 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-20 p-4 min-w-52">
      <button onClick={() => { onChange("any"); onClose() }}
        className={"w-full text-left text-sm px-2 py-1.5 rounded-lg mb-2 transition-colors " +
          (value === "any" ? "text-yellow-400 bg-zinc-700" : "text-zinc-300 hover:bg-zinc-700")}>
        Any rating
      </button>
      <div className="border-t border-zinc-700 pt-3">
        <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">Rating (or range)</p>
        <div className="flex mb-1" onMouseLeave={() => setHoverVal(0)}>
          {[1,2,3,4,5].map(star => (
            <div key={star} className="relative w-9 h-9 select-none">
              <svg viewBox="0 0 24 24" className="w-9 h-9 absolute pointer-events-none">
                <defs>
                  <linearGradient id={"rp-half-" + star}>
                    <stop offset="50%" stopColor="#eac54f"/>
                    <stop offset="50%" stopColor="transparent"/>
                  </linearGradient>
                </defs>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={
                    getStarFillType(star) === "full" ? "#eac54f" :
                    getStarFillType(star) === "half" ? `url(#rp-half-${star})` :
                    "none"
                  }
                  stroke={getStarFillType(star) !== "none" ? "#eac54f" : "#52525b"}
                  strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div className="absolute inset-0 flex cursor-pointer">
                <div className="w-1/2 h-full"
                  onMouseEnter={() => handleHalf(star, "left")}
                  onMouseDown={() => handleDown(star, "left")}
                  onMouseUp={() => handleUp(star, "left")} />
                <div className="w-1/2 h-full"
                  onMouseEnter={() => handleHalf(star, "right")}
                  onMouseDown={() => handleDown(star, "right")}
                  onMouseUp={() => handleUp(star, "right")} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-zinc-600 text-xs">Click or drag to define range</p>
      </div>
    </div>
  )
}

export default function ProfileClient({ user, reviews = [], trackRatings = [] }: {
  user: User
  reviews: Review[]
  trackRatings: TrackRating[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"albums" | "tracks">("albums")
  const [lovedFilter, setLovedFilter] = useState<"all" | "loved">("all")
  const [sort, setSort] = useState<"recent" | "rating">("recent")
  const [trackSort, setTrackSort] = useState<"recent" | "rating">("recent")
  const [ratingFilter, setRatingFilter] = useState("any")
  const [showDropdown, setShowDropdown] = useState(false)

  const loved = reviews.filter(r => r.isLoved).length
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—"
  const avgTrackRating = trackRatings.length
    ? (trackRatings.reduce((s, r) => s + r.rating, 0) / trackRatings.length).toFixed(1)
    : "—"

  const filteredReviews = reviews
    .filter(r => lovedFilter === "all" || r.isLoved)
    .filter(r => matchesFilter(r.rating, ratingFilter))
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return dateB - dateA
    })

  const filteredTracks = [...trackRatings]
    .filter(r => matchesFilter(r.rating, ratingFilter))
    .sort((a, b) => {
      if (trackSort === "rating") return b.rating - a.rating
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const selectedLabel = ratingFilter === "any" ? "" : ratingFilter.includes("-")
    ? ratingFilter.replace("-", "–") + "★"
    : ratingFilter + "★"

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto p-8">

        <div className="flex items-center justify-between mb-10">
          <Link href="/feed" className="text-zinc-500 hover:text-white text-sm transition-colors">
            Back to search
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
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Albums", value: reviews.length },
            { label: "Loved", value: loved },
            { label: "Avg Album", value: avgRating },
            { label: "Tracks Rated", value: trackRatings.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-zinc-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg w-fit">
          {(["albums", "tracks"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={"px-5 py-2 rounded-md text-sm font-medium transition-colors " +
                (tab === t ? "bg-white text-black" : "text-zinc-400 hover:text-white")}>
              {t === "albums" ? `Albums (${reviews.length})` : `Tracks (${trackRatings.length})`}
            </button>
          ))}
        </div>

        {/* Shared filter bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {tab === "albums" && (
              <>
                {(["all", "loved"] as const).map(f => (
                  <button key={f} onClick={() => setLovedFilter(f)}
                    className={"text-sm px-4 py-1.5 rounded-full transition-colors " +
                      (lovedFilter === f ? "bg-white text-black font-medium" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
                    {f === "all" ? "All" : "Loved"}
                  </button>
                ))}
              </>
            )}

            {/* Rating dropdown */}
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)}
                className={"flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors " +
                  (ratingFilter !== "any"
                    ? "border-yellow-500 text-yellow-400 bg-yellow-950/30"
                    : "border-zinc-700 text-zinc-400 hover:text-white bg-zinc-800")}>
                Rating{selectedLabel ? ` · ${selectedLabel}` : ""}
                <span className="text-xs">{showDropdown ? "▲" : "▼"}</span>
              </button>

              {showDropdown && (
                <RatingPicker
                  value={ratingFilter}
                  onChange={setRatingFilter}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            {(["recent", "rating"] as const).map(s => (
              <button key={s}
                onClick={() => tab === "albums" ? setSort(s) : setTrackSort(s)}
                className={"text-xs px-3 py-1 rounded-full transition-colors " +
                  ((tab === "albums" ? sort : trackSort) === s
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-white")}>
                {s === "recent" ? "Recent" : "Top Rated"}
              </button>
            ))}
          </div>
        </div>

        {/* Albums tab */}
        {tab === "albums" && (
          filteredReviews.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">No reviews match.</p>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map(r => (
                <div key={r.id}
                  className="bg-zinc-900 hover:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-colors"
                  onClick={() => router.push("/review/" + r.id)}>
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
                      <div className="mt-1"><StarRating rating={r.rating} /></div>
                      <p className="text-zinc-600 text-xs mt-0.5">{new Date(r.listenedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
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
          )
        )}

        {/* Tracks tab */}
        {tab === "tracks" && (
          <>
            <p className="text-zinc-500 text-xs mb-4">{trackRatings.length} tracks rated · avg {avgTrackRating}/5</p>
            {filteredTracks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 mb-2">No tracks rated yet.</p>
                <p className="text-zinc-600 text-sm">Rate individual tracks when reviewing an album.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTracks.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-900 transition-colors">
                    <span className="text-zinc-600 text-sm w-5 text-right shrink-0">{i + 1}</span>
                    {r.track.album.coverUrl && (
                      <img src={r.track.album.coverUrl} alt={r.track.album.title}
                        className="w-10 h-10 rounded object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.track.title}</p>
                      <p className="text-zinc-500 text-xs truncate">{r.track.album.artistName} · {r.track.album.title}</p>
                    </div>
                    <div className="shrink-0"><StarRating rating={r.rating} /></div>
                    {r.track.durationMs && (
                      <span className="text-zinc-600 text-xs shrink-0 w-10 text-right">
                        {msToTime(r.track.durationMs)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}
