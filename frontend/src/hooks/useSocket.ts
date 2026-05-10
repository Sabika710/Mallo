'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@clerk/nextjs'

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELED'
  | 'AI_MESSAGE'

export interface WsNotification {
  id: string
  type: NotificationType
  message: string
  orderId?: string
  timestamp: Date
}

export function useSocket() {
  const { getToken, userId } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [notifications, setNotifications] = useState<WsNotification[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    let socket: Socket

    const init = async () => {
      const token = await getToken()
      const WS = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'

      socket = io(WS, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1500,
      })

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('join', { userId })
      })
      socket.on('disconnect', () => setConnected(false))
      socket.on('notification', (data: Omit<WsNotification, 'id' | 'timestamp'>) => {
        setNotifications(prev =>
          [{ ...data, id: crypto.randomUUID(), timestamp: new Date() }, ...prev].slice(0, 30),
        )
      })

      socketRef.current = socket
    }

    init()
    return () => { socket?.disconnect() }
  }, [userId, getToken])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, connected, dismiss }
}
