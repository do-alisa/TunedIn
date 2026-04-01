export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold text-white">TunedIn</h1>
        <p className="text-zinc-400 text-lg">Letterboxd for music.</p>
        <a href="/api/auth/spotify" className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-4 rounded-full text-lg transition-colors">
          Continue with Spotify
        </a>
      </div>
    </main>
  )
}
