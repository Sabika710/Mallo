'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { NotificationToasts } from '@/components/ui/NotificationToasts'
import { useApi } from '@/hooks/useApi'
import type { Brand } from '@/lib/api'

export function DashboardHeader() {
  const { call } = useApi()
  const { notifications, connected, dismiss } = useSocket()
  const [brand, setBrand] = useState<Brand | null>(null)

  useEffect(() => {
    call<Brand>('brands/me')
      .then(b => setBrand(b))
      .catch(() => {})
  }, [call])

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#e4d9ea] bg-white flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-[#2d1f35]">
            {brand?.name ?? 'Brand Dashboard'}
          </p>
          <p className="text-xs text-[#a08aad]">Manage your storefront</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs">
            {connected
              ? <><Wifi size={12} className="text-green-400" /><span className="text-stone-500">Live</span></>
              : <><WifiOff size={12} className="text-red-400" /><span className="text-stone-500">Offline</span></>
            }
          </span>

          <button className="relative w-8 h-8 rounded-lg bg-surface-2 border border-[#e4d9ea] flex items-center justify-center text-[#6b4f7a] hover:text-[#2d1f35] transition-colors">
            <Bell size={14} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-[#6b4f7a] text-[10px] flex items-center justify-center font-medium">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          <div className="relative z-[9999]">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <NotificationToasts notifications={notifications} onDismiss={dismiss} />
    </>
  )
}