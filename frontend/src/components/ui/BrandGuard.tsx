'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/useApi'
import { Loader2 } from 'lucide-react'
import type { Brand } from '@/lib/api'

export function BrandGuard({ children }: { children: React.ReactNode }) {
  const { call } = useApi()
  const router   = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    call<Brand>('brands/me')
      .then(() => {
        // Brand exists for this user — allow dashboard access
        setChecking(false)
      })
      .catch(() => {
        // No brand for this user — send to onboarding
        router.replace('/onboarding')
      })
  }, [call, router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-brand-400 mx-auto" size={32} />
          <p className="text-stone-400 text-sm">Loading your brand…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}