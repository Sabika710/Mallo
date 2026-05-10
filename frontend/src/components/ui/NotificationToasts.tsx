'use client'

import { useEffect } from 'react'
import { X, CheckCircle, Truck, Package, XCircle, Sparkles } from 'lucide-react'
import type { WsNotification, NotificationType } from '@/hooks/useSocket'

const ICONS: Record<NotificationType, React.ReactNode> = {
  ORDER_CONFIRMED:  <CheckCircle size={15} className="text-green-400 flex-shrink-0" />,
  ORDER_DISPATCHED: <Truck       size={15} className="text-blue-400  flex-shrink-0" />,
  ORDER_DELIVERED:  <Package     size={15} className="text-brand-400 flex-shrink-0" />,
  ORDER_CANCELED:   <XCircle     size={15} className="text-red-400   flex-shrink-0" />,
  AI_MESSAGE:       <Sparkles    size={15} className="text-brand-400 flex-shrink-0" />,
}

interface Props {
  notifications: WsNotification[]
  onDismiss: (id: string) => void
}

export function NotificationToasts({ notifications, onDismiss }: Props) {
  // Auto-dismiss the latest toast after 6 s
  useEffect(() => {
    if (!notifications.length) return
    const id = notifications[0].id
    const t = setTimeout(() => onDismiss(id), 6000)
    return () => clearTimeout(t)
  }, [notifications, onDismiss])

  if (!notifications.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.slice(0, 3).map(n => (
        <div
          key={n.id}
          className="pointer-events-auto flex items-start gap-3 glass bg-surface-2 rounded-xl p-4 shadow-2xl animate-slide-up"
        >
          <div className="mt-0.5">{ICONS[n.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-500 leading-snug">{n.message}</p>
            <p className="text-xs text-stone-500 mt-1">
              {new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(n.timestamp)}
            </p>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="flex-shrink-0 text-stone-500 hover:text-stone-400 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
