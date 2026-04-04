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

type SpotifyTrack = {
  id: string
  name: string
  track_number: number
  duration_ms: number
  uri: string
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

function StarRating({ rating, onChange, size = "md" }: { rating: number; onChange?: (r: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0)
  const display = hover || rating
  const dim = size === "sm" ? "w-4 h-4" : "w-7 h-7"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const full = display >= star
        const half = !full && display >= star - 0.5
        return (
          <div key={star} className={"relative " + dim + (onChange ? " cursor-pointer" : "")}>
            <svg viewBox="0 0 24 24" className={"absolute " + dim}>
              <defs>
                <linearGradient id={"half-" + star}>
                  <stop offset="50%" stopColor="#eac54f"/>
                  <stop offset="50%" stopColor="transparent"/>
                </linearGradient>
              </defs>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={full ? "#eac54f" : half ? "url(#half-" + star + ")" : "none"}
                stroke={full || half ? "#eac54f" : "#52525b"}
                strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {onChange && (
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full"
                  onMouseEnter={() => setHover(star - 0.5)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => onChange(star - 0.5)} />
                <div className="w-1/2 h-full"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => onChange(star)} />
              </div>
            )}
          </div>
        )
      })}
      {onChange && <span className="ml-2 text-zinc-400 text-sm w-8 text-right inline-block">{display > 0 ? display + "/5" : ""}</span>}
    </div>
  )
}

function msToTime(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function PlaylistStarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const display = hover || value

  return (
    <div className="space-y-1">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(star => {
          const full = display >= star
          const half = !full && display >= star - 0.5
          return (
            <div key={star} className="relative w-9 h-9 cursor-pointer select-none">
              <svg viewBox="0 0 24 24" className="w-9 h-9 absolute pointer-events-none">
                <defs>
                  <linearGradient id={"pl-half-" + star}>
                    <stop offset="50%" stopColor="#eac54f"/>
                    <stop offset="50%" stopColor="transparent"/>
                  </linearGradient>
                </defs>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={full ? "#eac54f" : half ? "url(#pl-half-"+star+")" : "none"}
                  stroke={full || half ? "#eac54f" : "#52525b"}
                  strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full"
                  onMouseEnter={() => setHover(star - 0.5)}
                  onMouseDown={() => setDragStart(star - 0.5)}
                  onMouseUp={() => { onChange(dragStart !== null && dragStart !== star - 0.5 ? Math.min(dragStart, star - 0.5) : star - 0.5); setDragStart(null) }} />
                <div className="w-1/2 h-full"
                  onMouseEnter={() => setHover(star)}
                  onMouseDown={() => setDragStart(star)}
                  onMouseUp={() => { onChange(star); setDragStart(null) }} />
              </div>
            </div>
          )
        })}
        <span className="ml-2 self-center text-zinc-400 text-sm">{value}+ stars</span>
      </div>
      <p className="text-zinc-600 text-xs">Click to set minimum rating</p>
    </div>
  )
}

export default function FeedClient({ userName }: { userName: string }) {
  const [query, setQuery] = useState("")
  const [albums, setAlbums] = useState<Album[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Album | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
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
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [trackRatings, setTrackRatings] = useState<Record<string, number>>({})
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [listenedAt, setListenedAt] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [minRating, setMinRating] = useState(4)
  const [playlistName, setPlaylistName] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedPlaylist, setGeneratedPlaylist] = useState<{ tracks: { title: string; spotifyTrackId: string; rating: number; spotifyUrl: string }[]; trackCount: number; playlistName: string } | null>(null)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setAlbums([])
    const res = await fetch("/api/search?q=" + encodeURIComponent(query))
    const data = await res.json()
    setAlbums(data.albums ?? [])
    setSearching(false)
  }

  async function selectAlbum(album: Album) {
    setSelected(album)
    setAlbums([])
    setLoadingTracks(true)
    const res = await fetch("/api/search?tracklist=" + album.id)
    const data = await res.json()
    setTracks(data.tracks ?? [])
    setLoadingTracks(false)
  }

  async function submitReview() {
    const ratedTrackCount = Object.keys(trackRatings).length
    if (!selected) return
    if (rating === 0 && ratedTrackCount === 0) return
    setSubmitting(true)

    const reviewRes = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotifyAlbumId: selected.id,
        title: selected.name,
        artistName: selected.artists[0]?.name,
        coverUrl: selected.images[0]?.url,
        releaseYear: parseInt(selected.release_date?.split("-")[0] ?? "0"),
        rating, isLoved, notes, listenedAt,
        lyricsScore: lyricsEnabled ? lyricsScore : null,
        productionScore: productionEnabled ? productionScore : null,
        replayScore: replayEnabled ? replayScore : null,
        emotionScore: emotionEnabled ? emotionScore : null,
      }),
    })
    const reviewData = await reviewRes.json()

    // Save track ratings if any
    const ratedTracks = tracks
      .filter(t => trackRatings[t.id])
      .map(t => ({
        spotifyTrackId: t.id,
        title: t.name,
        trackNumber: t.track_number,
        durationMs: t.duration_ms,
        rating: trackRatings[t.id],
      }))

    if (ratedTracks.length > 0 && reviewData.albumDbId) {
      await fetch("/api/track-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: ratedTracks, albumId: reviewData.albumDbId }),
      })
    }

    setSubmitting(false)
    setSubmitted(true)
    setSelected(null)
    setRating(0)
    setNotes("")
    setIsLoved(false)
    setLyricsScore(3)
    setProductionScore(3)
    setReplayScore(3)
    setEmotionScore(3)
    setLyricsEnabled(false)
    setProductionEnabled(false)
    setReplayEnabled(false)
    setEmotionEnabled(false)
    setShowSliders(false)
    setListenedAt(new Date().toISOString().split('T')[0])
    setTracks([])
    setTrackRatings({})
    setTimeout(() => setSubmitted(false), 3000)
  }

  async function generatePlaylist() {
    setGenerating(true)
    setGeneratedPlaylist(null)
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minRating, playlistName }),
    })
    const data = await res.json()
    if (data.tracks) {
      setGeneratedPlaylist({ tracks: data.tracks, trackCount: data.trackCount, playlistName: data.playlistName })
    } else {
      alert(data.error ?? "Something went wrong")
    }
    setGenerating(false)
  }

  const displayRating = hoverRating || rating

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
          <input type="text" value={query}
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
              <button key={album.id} onClick={() => selectAlbum(album)}
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

            {/* Album header */}
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
              <button onClick={() => { setSelected(null); setTracks([]); setTrackRatings({}) }}
                className="text-zinc-500 hover:text-white text-xl self-start">x</button>
            </div>

            {/* Album rating */}
            <div className="mb-5">
              <p className="text-sm text-zinc-400 mb-2">Album rating</p>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(star => {
                  const full = displayRating >= star
                  const half = !full && displayRating >= star - 0.5
                  return (
                    <div key={star} className="relative w-7 h-7 cursor-pointer">
                      <svg viewBox="0 0 24 24" className="w-7 h-7 absolute">
                        <defs>
                          <linearGradient id={"ar-half-" + star}>
                            <stop offset="50%" stopColor="#eac54f"/>
                            <stop offset="50%" stopColor="transparent"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={full ? "#eac54f" : half ? "url(#ar-half-" + star + ")" : "none"}
                          stroke={full || half ? "#eac54f" : "#52525b"}
                          strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full"
                          onMouseEnter={() => setHoverRating(star - 0.5)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star - 0.5)} />
                        <div className="w-1/2 h-full"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)} />
                      </div>
                    </div>
                  )
                })}
                <span className="ml-2 text-zinc-400 text-sm w-8 text-right inline-block">
                  {displayRating > 0 ? displayRating + "/5" : ""}
                </span>
              </div>
            </div>

            {/* Love + notes */}
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

            {/* Optional detail sliders */}
            <div className="mb-6">
              <button type="button" onClick={() => setShowSliders(!showSliders)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-3">
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
                        className={"w-full accent-green-500 " + (enabled ? "opacity-100" : "opacity-30")} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Track ratings */}
            <div className="border-t border-zinc-800 pt-5 mb-6">
              <p className="text-sm font-medium text-zinc-300 mb-1">Rate individual tracks</p>

              {loadingTracks ? (
                <p className="text-zinc-500 text-sm">Loading tracklist...</p>
              ) : (
                <div className="space-y-2">
                  {tracks.map(track => (
                    <div key={track.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                      <span className="text-zinc-600 text-xs w-5 text-right shrink-0">{track.track_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{track.name}</p>
                        <p className="text-zinc-600 text-xs">{msToTime(track.duration_ms)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StarRating
                          rating={trackRatings[track.id] ?? 0}
                          onChange={r => setTrackRatings(prev => ({ ...prev, [track.id]: r }))}
                          size="sm"
                        />
                        {trackRatings[track.id] && (
                          <button onClick={() => setTrackRatings(prev => { const n = {...prev}; delete n[track.id]; return n })}
                            className="text-zinc-600 hover:text-zinc-400 text-xs ml-1">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs text-zinc-500 block mb-1">Listened on</label>
              <input
                type="date"
                value={listenedAt}
                max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` })()}
                onChange={e => setListenedAt(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>

            <button onClick={submitReview} disabled={submitting || (rating === 0 && Object.keys(trackRatings).length === 0)}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? "Saving..." : rating === 0 ? "Save Track Ratings Only" : "Save Review"}
            </button>
          </div>
        )}

        {/* Playlist Generator */}
        <div className="mt-8 border-t border-zinc-800 pt-8">
          <button onClick={() => setShowPlaylist(!showPlaylist)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
            </svg>
            <span className="font-medium">Generate a Playlist</span>
            <span className="text-zinc-600 text-sm">{showPlaylist ? "▲" : "▼"}</span>
          </button>

          {showPlaylist && (
            <div className="bg-zinc-900 rounded-xl p-6">
              <p className="text-zinc-400 text-sm mb-5">Browse your highest-rated tracks!</p>
              <div className="space-y-4 mb-6">
                <div>
                  <PlaylistStarPicker value={minRating} onChange={setMinRating} />
                </div>
              </div>
              <button onClick={generatePlaylist} disabled={generating}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? "Generating..." : "Generate Track List"}
              </button>
              {generatedPlaylist && (
                <div className="mt-4 space-y-3">
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <p className="text-green-300 font-medium mb-1">{generatedPlaylist.playlistName}</p>
                    <p className="text-zinc-400 text-sm">{generatedPlaylist.trackCount} tracks • Click any track to open in Spotify</p>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {generatedPlaylist.tracks.map((t, i) => (
                      <a key={t.spotifyTrackId}
                        href={t.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800 transition-colors group">
                        <span className="text-zinc-600 text-xs w-5 text-right shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate group-hover:text-green-400 transition-colors">{t.title}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} viewBox="0 0 24 24" className="w-3 h-3">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                fill={t.rating >= s ? "#eac54f" : t.rating >= s - 0.5 ? "#eac54f" : "none"}
                                stroke={t.rating >= s - 0.5 ? "#eac54f" : "#52525b"}
                                strokeWidth="1.5" strokeLinejoin="round"/>
                            </svg>
                          ))}
                        </div>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-600 group-hover:text-green-400 transition-colors shrink-0" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
