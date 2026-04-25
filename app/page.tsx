import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07070f] text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-black text-[#7fff6e] mb-4">ViralChart</h1>
      <p className="text-xl text-gray-400 mb-2">Animated chart videos that go viral.</p>
      <p className="text-gray-500 mb-10 text-sm">
        TikTok · Instagram · YouTube Shorts
      </p>

      <Link
        href="/editor"
        className="bg-[#7fff6e] text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-[#b4ff3a] transition"
      >
        Open the editor →
      </Link>

      <div className="mt-16 flex gap-12 text-center">
        <div>
          <div className="text-3xl font-black text-[#7fff6e]">$4.99</div>
          <div className="text-gray-400 text-sm">/month</div>
        </div>
        <div>
          <div className="text-3xl font-black">No watermark</div>
          <div className="text-gray-400 text-sm">on exports</div>
        </div>
        <div>
          <div className="text-3xl font-black">1080p</div>
          <div className="text-gray-400 text-sm">video quality</div>
        </div>
      </div>
    </main>
  )
}