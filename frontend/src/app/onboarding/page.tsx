'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ShoppingBag, ArrowRight, Loader2, Building2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import type { Brand } from '@/lib/api'

export default function OnboardingPage() {
  const { userId, isLoaded } = useAuth()
  const { call }   = useApi()
  const router     = useRouter()
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)
  const [error,    setError]    = useState('')

  // Check if this user already has a brand — if so skip onboarding
  useEffect(() => {
    if (!isLoaded || !userId) return
    call<Brand>('brands/me')
      .then(() => router.replace('/dashboard'))
      .catch(() => setChecking(false)) // no brand — show the form
  }, [isLoaded, userId, call, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !userId) return

    setLoading(true)
    setError('')
    try {
      await call<Brand>('brands', {
        method: 'POST',
        body: { name: name.trim(), clerkOrgId: userId },
      })
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-900/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 items-center justify-center mb-4">
            <ShoppingBag size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">Set Up Your Brand</h1>
          <p className="text-stone-400 text-sm">One step from joining the mall.</p>
        </div>

        <div className="glass bg-surface-2 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-2">Brand Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Khilonay"
                  required
                  autoFocus
                  disabled={loading}
                  className="w-full bg-surface-3 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-brand-600 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="p-4 rounded-xl bg-brand-900/20 border border-brand-800/30 text-xs text-stone-400 space-y-1">
              <p className="font-medium text-stone-300 mb-1">What happens next?</p>
              <p>• Brand dashboard is created instantly</p>
              <p>• Connect Stripe to receive 90% of each sale</p>
              <p>• List products and start selling immediately</p>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creating brand…</>
                : <>Launch My Brand <ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}