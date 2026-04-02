"use client"

import { useState } from "react"
import Link from "next/link"

type Album = {
  id: string
  name: string
  artists: { name: string }[]
  images: { url: string }[]
  release_date: string
}

type Review = {
  id: string
  rating: number
  isLoved: boolean
  notes: string | null
  lyricsScore: number | null
  productionScore: number | null
  replayScore: number | null
  emotionScore: number | null
  album: { title: string; artistName: string; coverUrl: string | null }
}

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  const display = hover || rating

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const full = display >= star
        const half = !full && display >= star - 0.5
        return (
          <div key={star} className="relative w-7 h-7 cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-7 h-7 absolute">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={full ? "#eac54f" : half ? "url(#half)" : "none"}
                stroke={full || half ? "#eac54f" : "#52525b"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#eac54f"/>
                  <stop offset="50%" stopColor="transparent"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full"
                onMouseEnter={() => setHover(star - 0.5)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onChange(star - 0.5)}
              />
              <div className="w-1/2 h-full"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onChange(star)}
              />
            </div>
          </div>
        )
      })}
      <span className="ml-2 text-zinc-400 text-sm w-8 text-right inline-block">{display > 0 ? `${display}/5` : ""}</span>
    </div>
  )
}

export default function FeedClient({ userName }: { userName: string }) {
  const [query, setQuery] = useState("")
  const [albums, setAlbums] = useState<Album[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Album | null>(null)
  const [rating, setRating] = useState(0)
  const [isLoved, setIsLoved] = useState(false)
  const [notes, setNotes] = useState("")
  const [lyricsScore, setLyricsScore] = useState(3)
  const [productionScore, setProductionScore] = useState(3)
  const [replayScore, setReplayScore] = useState(3)
  const [emotionScore, setEmotionScore] = useState(3)
  const [showSliders, setShowSliders] = useState(false)
  const [lyricsEnabled, setLyricsEnabled] = useState(false)
  const [productionEnabled, setProductionEnabled] = useState(false)
  const [replayEnabled, setReplayEnabled] = useState(false)
  const [emotionEnabled, setEmotionEnabled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviews, setShowReviews] = useState(false)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setAlbums([])
    const res = await fetch("/api/search?q=" + encodeURIComponent(query))
    const data = await res.json()
    setAlbums(data.albums ?? [])
    setSearching(false)
  }

  async function loadReviews() {
    const res = await fetch("/api/reviews")
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setShowReviews(true)
  }

  async function submitReview() {
    if (!selected || rating === 0) return
    setSubmitting(true)
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotifyAlbumId: selected.id,
        title: selected.name,
        artistName: selected.artists[0]?.name,
        coverUrl: selected.images[0]?.url,
        releaseYear: parseInt(selected.release_date?.split("-")[0] ?? "0"),
        rating, isLoved, notes, lyricsScore: lyricsEnabled ? lyricsScore : null, productionScore: productionEnabled ? productionScore : null, replayScore: replayEnabled ? replayScore : null, emotionScore: emotionEnabled ? emotionScore : null,
      }),
    })
    setSubmitting(false)
    setSubmitted(true)
    setSelected(null)
    setRating(0)
    setNotes("")
    setIsLoved(false)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto p-8">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">TunedIn</h1>
            <p className="text-zinc-400 mt-1">Welcome back, {userName}</p>
          </div>
          <Link href="/profile" className="text-sm text-zinc-400 hover:text-white transition-colors">
            My Reviews
          </Link>
        </div>

        {submitted && (
          <div className="mb-6 bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
            Review saved!
          </div>
        )}

        <div className="flex gap-3 mb-8">
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") search() }}
            placeholder="Search for an album..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button onClick={search} disabled={searching}
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50">
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {albums.length > 0 && !selected && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {albums.map(album => (
              <button key={album.id}
                onClick={() => { setSelected(album); setAlbums([]) }}
                className="text-left bg-zinc-900 hover:bg-zinc-800 rounded-lg p-3 transition-colors">
                {album.images[0] && (
                  <img src={album.images[0].url} alt={album.name}
                    className="w-full aspect-square object-cover rounded mb-2" />
                )}
                <p className="font-medium text-sm truncate">{album.name}</p>
                <p className="text-zinc-400 text-xs truncate">{album.artists[0]?.name}</p>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <div className="flex gap-4 mb-6">
              {selected.images[0] && (
                <img src={selected.images[0].url} alt={selected.name}
                  className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-zinc-400">{selected.artists[0]?.name}</p>
                <p className="text-zinc-500 text-sm">{selected.release_date?.split("-")[0]}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white text-xl self-start">x</button>
            </div>

            <div className="mb-5">
              <p className="text-sm text-zinc-400 mb-2">Rating</p>
              <StarRating rating={rating} onChange={setRating} />
            </div>

            <button onClick={() => setIsLoved(!isLoved)}
              className={"mb-5 flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors " +
                (isLoved ? "border-red-500 text-red-400 bg-red-950/30" : "border-zinc-700 text-zinc-400 hover:border-zinc-500")}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isLoved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {isLoved ? "Loved it!" : "Love it?"}
            </button>

            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Write a note about this album..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none resize-none mb-5"
              rows={3} />

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowSliders(!showSliders)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-3"
              >
                <span>{showSliders ? "▾" : "▸"}</span>
                {showSliders ? "Hide detailed ratings" : "Add detailed ratings (optional)"}
              </button>
              {showSliders && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Lyrics", value: lyricsScore, set: setLyricsScore, enabled: lyricsEnabled, setEnabled: setLyricsEnabled },
                    { label: "Production", value: productionScore, set: setProductionScore, enabled: productionEnabled, setEnabled: setProductionEnabled },
                    { label: "Replay Value", value: replayScore, set: setReplayScore, enabled: replayEnabled, setEnabled: setReplayEnabled },
                    { label: "Emotional Impact", value: emotionScore, set: setEmotionScore, enabled: emotionEnabled, setEnabled: setEmotionEnabled },
                  ].map(({ label, value, set, enabled, setEnabled }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
                            className="accent-green-500 w-3 h-3" />
                          {label}
                        </label>
                        {enabled && <span>{value}/5</span>}
                      </div>
                      <input type="range" min={1} max={5} value={value}
                        onChange={e => set(Number(e.target.value))}
                        disabled={!enabled}
                        className={"w-full accent-green-500 transition-opacity " + (enabled ? "opacity-100" : "opacity-30")} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={submitReview} disabled={submitting || rating === 0}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? "Saving..." : "Save Review"}
            </button>
          </div>
        )}

        {showReviews && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-zinc-500">No reviews yet. Search for an album above!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id}
                    className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors"
                    onClick={() => setExpandedReview(expandedReview === r.id ? null : r.id)}>
                    <div className="flex items-center gap-4 p-4">
                      {r.album.coverUrl && (
                        <img src={r.album.coverUrl} alt={r.album.title} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{r.album.title}</p>
                        <p className="text-zinc-400 text-sm">{r.album.artistName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating rating={r.rating} onChange={() => {}} />
                        {r.isLoved && (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-400" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-zinc-600 text-sm ml-1">{expandedReview === r.id ? "▲" : "▼"}</span>
                    </div>
                    {expandedReview === r.id && (
                      <div className="px-4 pb-5 border-t border-zinc-800 pt-4 space-y-4">
                        {r.notes && (
                          <p className="text-zinc-300 text-sm italic leading-relaxed">"{r.notes}"</p>
                        )}
                        {(r.lyricsScore || r.productionScore || r.replayScore || r.emotionScore) && (
                          <div className="space-y-2">
                            {[
                              { label: "Lyrics", value: r.lyricsScore },
                              { label: "Production", value: r.productionScore },
                              { label: "Replay Value", value: r.replayScore },
                              { label: "Emotional Impact", value: r.emotionScore },
                            ].filter(s => s.value).map(({ label, value }) => (
                              <div key={label} className="flex items-center gap-3">
                                <span className="text-zinc-500 text-xs w-32 shrink-0">{label}</span>
                                <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                                  <div
                                    className="bg-green-500 h-1.5 rounded-full"
                                    style={{ width: `${(value! / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-zinc-400 text-xs w-6 text-right">{value}/5</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!r.notes && !r.lyricsScore && !r.productionScore && !r.replayScore && !r.emotionScore && (
                          <p className="text-zinc-600 text-sm">No additional details added.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
