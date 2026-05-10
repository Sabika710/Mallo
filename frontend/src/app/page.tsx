// Server Component — renders static SEO content.
// Interactive nav (UserButton, sign-in links) is delegated to HomeNav (client).
import { HomeNav } from '@/components/ui/HomeNav'
import { ShoppingBag, Sparkles, Store, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Sparkles,
    title: 'AI Concierge',
    desc: "Mallo enforces each brand's online presence automatically — The smart AI will not just listen but take actions to your demands 🤖.",
  },
  {
    icon: Store,
    title: 'Multi-Brand Mall',
    desc: 'Order from your favorit Brands on the same platform🎉',
  },
  {
    icon: Star,
    title: 'Real-Time Updates',
    desc: 'WebSocket notifications push order confirmations, dispatch alerts, and AI messages instantly 👍.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Static layered background — pure CSS, no JS, no hydration risk */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#faf8fc] to-[#f3eef8]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-300/30 rounded-full blur-3xl" />
      </div>

      {/* Nav — client island for Clerk UserButton / sign-in links */}
      <HomeNav />

      {/* Hero — pure server-rendered HTML, no hydration mismatch */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-900/50 border border-brand-700/50 text-brand-300">
            <Sparkles size={11} />
            AI-Powered Marketplace
          </span>
        </div>

        <h1 className="font-display text-6xl md:text-7xl font-semibold text-center leading-tight mb-6 text-[#2d1f35]">
          Intelligent{' '}
          <span className="brand-gradient-text">Commerce</span>
          <br />Zero Friction
        </h1>

        <p className="text-center text-[#6b4f7a] text-lg max-w-xl mx-auto mb-12">
          Stop managing and start scaling. Our AI-driven engine handles the complexity of multi-brand presence, 
          giving your customers a seamless concierge experience.
        </p>

        {/* CTAs — static links, no JS needed */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link
            href="/store"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-medium transition-colors"
          >
            <ShoppingBag size={17} />
            Shop Now
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass glass-hover font-medium"
          >
            List Your Brand
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-900/50 border border-brand-800/50 flex items-center justify-center mb-4">
                <Icon size={18} className="text-brand-800" />
              </div>
              <h3 className="font-display text-lg font-medium mb-2">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
