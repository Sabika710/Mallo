'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Shield, RefreshCw } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import type { Brand } from '@/lib/api'

export default function SettingsPage() {
  const { call } = useApi()
  const searchParams = useSearchParams()
  const stripeParam = searchParams.get('stripe')

  const [brand,         setBrand]         = useState<Brand | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [savingPolicy,  setSavingPolicy]  = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeMsg,     setStripeMsg]     = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  // Handle Stripe redirect params
  useEffect(() => {
    if (stripeParam === 'success') {
      setStripeMsg({ type: 'success', text: 'Stripe onboarding submitted! Click Sync to confirm.' })
    } else if (stripeParam === 'refresh') {
      setStripeMsg({ type: 'info', text: 'Session expired. Please start onboarding again.' })
    }
  }, [stripeParam])

  const fetchBrand = useCallback(async () => {
    setLoading(true)
    try {
      const b = await call<Brand>('brands/me')
      setBrand(b)
    } catch (err: any) {
      console.error('settings fetch error:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [call])

  useEffect(() => { fetchBrand() }, [fetchBrand])

  const togglePolicy = async () => {
    if (!brand) return
    setSavingPolicy(true)
    try {
      const updated = await call<Brand>('brands/me/policy', {
        method: 'PATCH',
        body: { returnPolicy: !brand.returnPolicy },
      })
      setBrand(updated)
    } catch (err: any) {
      alert('Failed to update policy: ' + err?.message)
    } finally {
      setSavingPolicy(false)
    }
  }

  const startStripe = async () => {
    setStripeLoading(true)
    setStripeMsg(null)
    try {
      const { url } = await call<{ url: string }>('brands/me/stripe-onboard', { method: 'POST' })
      window.location.href = url
    } catch (err: any) {
      setStripeMsg({ type: 'info', text: `Error: ${err?.message}` })
      setStripeLoading(false)
    }
  }

  const syncStripe = async () => {
    setStripeLoading(true)
    setStripeMsg(null)
    try {
      const result = await call<{
        synced: boolean
        detailsSubmitted: boolean
        chargesEnabled: boolean
        payoutsEnabled: boolean
      }>('brands/me/stripe-sync', { method: 'POST' })

      if (result.synced) {
        setStripeMsg({ type: 'success', text: 'Stripe account verified and connected!' })
        const updated = await call<Brand>('brands/me')
        setBrand(updated)
      } else {
        setStripeMsg({
          type: 'info',
          text: `Not fully set up yet — Details submitted: ${result.detailsSubmitted}, Charges enabled: ${result.chargesEnabled}`,
        })
      }
    } catch (err: any) {
      setStripeMsg({ type: 'info', text: `Sync error: ${err?.message}` })
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-400" size={28} />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-stone-400">
        Could not load settings.{' '}
        <button onClick={fetchBrand} className="text-brand-400 underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-stone-500">Configure your brand</p>
      </div>

      {/* Brand info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-medium mb-4">Brand Information</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Name</span>
            <span className="font-medium">{brand.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Brand ID</span>
            <span className="font-mono text-xs text-stone-500">{brand.id}</span>
          </div>
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-800/30 flex items-center justify-center flex-shrink-0">
            <Shield size={17} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Stripe Payouts</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Connect Stripe to receive 90% of each sale automatically
            </p>
          </div>
          {/* Sync button — always visible when stripeAccountId exists */}
          {brand.stripeAccountId && (
            <button
              onClick={syncStripe}
              disabled={stripeLoading}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-300 transition-colors disabled:opacity-50"
              title="Sync status from Stripe"
            >
              {stripeLoading
                ? <Loader2 size={13} className="animate-spin" />
                : <RefreshCw size={13} />
              }
              Sync
            </button>
          )}
        </div>

        {/* Status messages */}
        {stripeMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${
            stripeMsg.type === 'success'
              ? 'bg-green-900/20 border border-green-700/30 text-green-700'
              : 'bg-blue-900/20 border border-blue-700/30 text-blue-400'
          }`}>
            {stripeMsg.type === 'success'
              ? <CheckCircle size={15} className="flex-shrink-0" />
              : <AlertCircle size={15} className="flex-shrink-0" />
            }
            {stripeMsg.text}
          </div>
        )}

        {brand.stripeOnboardingComplete ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-900/20 border border-green-700/30 text-green-700 text-sm">
            <CheckCircle size={15} />
            Stripe connected — payouts active!
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 text-amber-400 text-sm mb-4">
              <AlertCircle size={15} />
              Not connected. Complete onboarding to receive payments.
            </div>

            <div className="text-xs text-stone-500 mb-4 space-y-1">
              <p className="text-stone-400 font-medium">Stripe will ask for:</p>
              <p>• Business details (name, address)</p>
              <p>• Bank account for payouts</p>
              <p>• Identity verification</p>
            </div>

            <button
              onClick={startStripe}
              disabled={stripeLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248e6] disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {stripeLoading
                ? <Loader2 size={13} className="animate-spin" />
                : <ExternalLink size={13} />
              }
              {stripeLoading ? 'Redirecting to Stripe…' : 'Start Stripe Onboarding'}
            </button>
          </>
        )}
      </div>

      {/* Return Policy */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium mb-1">Return Policy</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {brand.returnPolicy
                ? 'Returns accepted after dispatch. AI will allow cancellations.'
                : 'No returns after dispatch. AI will block post-dispatch cancellations.'}
            </p>
          </div>
          <button
            onClick={togglePolicy}
            disabled={savingPolicy}
            aria-pressed={brand.returnPolicy}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${
              brand.returnPolicy ? 'bg-brand-500' : 'bg-surface-4 border border-white/10'
            }`}
          >
            {savingPolicy && (
              <Loader2 size={10} className="animate-spin absolute inset-0 m-auto text-white" />
            )}
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
              brand.returnPolicy ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-surface-3 border border-white/5 text-xs text-stone-500 leading-relaxed">
          <strong className="text-stone-400">AI agent rule:</strong>{' '}
          When disabled, post-dispatch cancellations receive:{' '}
          <em>&quot;I&apos;m sorry, this brand does not accept returns once an item is dispatched.&quot;</em>
        </div>
      </div>
    </div>
  )
}