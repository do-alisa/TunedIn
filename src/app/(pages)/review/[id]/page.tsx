import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"

const prisma = new PrismaClient()

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const full = rating >= star
        const half = !full && rating >= star - 0.5
        return (
          <svg key={star} viewBox="0 0 24 24" className="w-6 h-6">
            <defs>
              <linearGradient id={"h" + star}>
                <stop offset="50%" stopColor="#eac54f"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={full ? "#eac54f" : half ? "url(#h" + star + ")" : "none"}
              stroke={full || half ? "#eac54f" : "#52525b"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
      <span className="ml-2 text-zinc-400 text-lg">{rating}/5</span>
    </div>
  )
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params

  const session = await getSession()
  if (!session) redirect("/login")

  const review = await prisma.albumReview.findUnique({
    where: { id },
    include: { album: true, user: true },
  })

  if (!review) notFound()

  const scores = [
    { label: "Lyrics", value: review.lyricsScore },
    { label: "Production", value: review.productionScore },
    { label: "Replay Value", value: review.replayScore },
    { label: "Emotional Impact", value: review.emotionScore },
  ].filter(s => s.value !== null)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto p-8">

        <Link href="/profile" className="text-zinc-500 hover:text-white text-sm transition-colors mb-8 inline-block">
          Back to profile
        </Link>

        <div className="flex gap-6 mb-8">
          {review.album.coverUrl && (
            <img src={review.album.coverUrl} alt={review.album.title}
              className="w-36 h-36 rounded-xl object-cover shrink-0 shadow-2xl" />
          )}
          <div className="flex flex-col justify-center">
            <p className="text-zinc-500 text-sm mb-1">{review.album.releaseYear}</p>
            <h1 className="text-3xl font-bold mb-1">{review.album.title}</h1>
            <p className="text-zinc-400 text-lg mb-4">{review.album.artistName}</p>
            <StarRating rating={review.rating} />
          </div>
        </div>

        {review.isLoved && (
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-red-400 text-sm font-medium">Loved it</span>
          </div>
        )}

        {review.notes && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <p className="text-zinc-300 leading-relaxed italic">"{review.notes}"</p>
          </div>
        )}

        {scores.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Detailed Ratings</h2>
            <div className="space-y-4">
              {scores.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-zinc-400 text-sm w-36 shrink-0">{label}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(value! / 5) * 100}%` }} />
                  </div>
                  <span className="text-zinc-300 text-sm w-8 text-right">{value}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          {review.user.image && (
            <img src={review.user.image} alt={review.user.name ?? ""} className="w-6 h-6 rounded-full" />
          )}
          <span>Reviewed by <span className="text-zinc-300">{review.user.name}</span></span>
          <span>·</span>
          <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

      </div>
    </main>
  )
}
