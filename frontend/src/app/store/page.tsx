'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Search, Loader2, ShoppingCart, Sparkles, Check } from 'lucide-react'
import Link from 'next/link'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { productApi, type Product } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { CartIcon } from '@/components/ui/CartIcon'
import { CartDrawer } from '@/components/ui/CartDrawer'
import { AIChatWidget } from '@/components/chat/AIChatWidget'
import { NotificationToasts } from '@/components/ui/NotificationToasts'
import { useSocket } from '@/hooks/useSocket'

export default function StorePage() {
  const { addItem } = useCart()
  const [products, setProducts]     = useState<Product[]>([])
  const [search,   setSearch]       = useState('')
  const [loading,  setLoading]      = useState(true)
  const [cartOpen, setCartOpen]     = useState(false)
  const [addedId,  setAddedId]      = useState<string | null>(null)
  const { notifications, dismiss }  = useSocket()
  
  // Handle pending checkouts from multi-brand cart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('order') === 'pending') {
      const pending = sessionStorage.getItem('pendingCheckouts')
      if (pending) {
        const urls: string[] = JSON.parse(pending)
        if (urls.length > 0) {
          sessionStorage.setItem('pendingCheckouts', JSON.stringify(urls.slice(1)))
          setTimeout(() => { window.location.href = urls[0] }, 1500)
        } else {
          sessionStorage.removeItem('pendingCheckouts')
        }
      }
    }
  }, [])

  useEffect(() => {
    productApi.list()
      .then(p => setProducts(p))
      .finally(() => setLoading(false))
  }, [])

  const handleAddToCart = (product: Product) => {
    addItem(product, 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
    setCartOpen(true)
  }

  const shown = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-white border-b border-[#e4d9ea]">
        <Link href="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
            <ShoppingBag size={13} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-[#2d1f35]">Mallo</span>
        </Link>

        <div className="flex-1 relative max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a08aad]" />
          <input
            type="text"
            placeholder="Search products or brands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-1 border border-[#e4d9ea] rounded-xl pl-9 pr-3 py-2 text-sm text-[#2d1f35] placeholder-[#a08aad] focus:outline-none focus:border-brand-400 transition-colors"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {/* Cart icon */}
          <CartIcon onClick={() => setCartOpen(true)} />

          <SignedOut>
            <Link href="/sign-in" className="text-sm text-[#6b4f7a] hover:text-[#2d1f35] transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white transition-colors">
              Sell here
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm text-[#6b4f7a] hover:text-[#2d1f35] transition-colors">
              Dashboard
            </Link>
            <div className="relative z-[9999]">
              <UserButton afterSignOutUrl="/store" />
            </div>
          </SignedIn>
        </div>
      </nav>

      {/* Hero strip */}
      <div className="relative px-6 py-14 text-center border-b border-[#e4d9ea] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-100/60 to-transparent" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-100 border border-brand-200 px-3 py-1 rounded-full mb-4">
            <Sparkles size={10} /> AI-Curated Marketplace
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3 text-[#2d1f35]">
            Shop the Collection
          </h1>
          <p className="text-[#6b4f7a] text-sm max-w-sm mx-auto">
            Handpicked brands, seamless checkout, AI concierge ready to help instantly.
          </p>
        </div>
      </div>

      {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('order') === 'pending' && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-200 rounded-xl text-brand-700 text-sm">
            <Loader2 size={16} className="animate-spin flex-shrink-0" />
            Payment received! Redirecting you to the next brand checkout…
          </div>
        </div>
      )}

      {/* Product grid */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-brand-400" size={30} />
          </div>
        ) : shown.length === 0 ? (
          <p className="text-center py-32 text-[#a08aad]">
            {search ? `No results for "${search}"` : 'No products available yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shown.map(p => {
              const added = addedId === p.id
              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#e4d9ea] rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:shadow-brand-200/50 transition-all duration-300 group"
                >
                  <div className="h-52 bg-surface-1 overflow-hidden relative flex-shrink-0">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={36} className="text-brand-200" /></div>
                    }
                    {p.brand && (
                      <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#6b4f7a] border border-[#e4d9ea]">
                        {p.brand.name}
                      </span>
                    )}
                    {p.stock > 0 && p.stock < 10 && (
                      <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        Only {p.stock} left
                      </span>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-[#a08aad] text-sm font-medium">Sold Out</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4 flex flex-col">
                    <h3 className="font-medium text-[#2d1f35] mb-1 leading-snug">{p.name}</h3>
                    <p className="text-xs text-[#a08aad] mb-4 flex-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xl font-semibold text-brand-700">
                        ${(p.price / 100).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          added
                            ? 'bg-green-500 text-white'
                            : 'bg-brand-500 hover:bg-brand-400 text-white disabled:opacity-40'
                        }`}
                      >
                        {added
                          ? <><Check size={12} /> Added!</>
                          : <><ShoppingCart size={12} /> Add to Cart</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <AIChatWidget />
      <NotificationToasts notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}