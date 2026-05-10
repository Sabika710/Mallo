'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, TrendingUp, AlertCircle, Package, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useApi } from '@/hooks/useApi'
import type { Order, Brand } from '@/lib/api'

function Stat({ label, value, sub, colorClass, icon }: {
  label: string; value: string | number; sub?: string
  colorClass: string; icon: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-semibold">{value}</p>
        <p className="text-sm text-stone-400">{label}</p>
        {sub && <p className="text-xs text-stone-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { call } = useApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [brand, setBrand]   = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      call<Order[]>('orders').catch(() => [] as Order[]),
      call<Brand>('brands/me').catch(() => null),
    ]).then(([o, b]) => {
      setOrders(o)
      setBrand(b)
      setLoading(false)
    })
  }, [call])

  const revenue  = orders.filter(o => o.status !== 'CANCELED').reduce((s, o) => s + o.totalAmount, 0)
  const pending  = orders.filter(o => o.status === 'PENDING').length
  const dispatch = orders.filter(o => o.status === 'DISPATCHED').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-brand-450" size={30} />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {brand && !brand.stripeOnboardingComplete && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-900/20 border border-amber-700/40 text-amber-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">Complete Stripe onboarding to receive payments.</span>
          <Link href="/dashboard/settings" className="underline underline-offset-2 text-xs flex-shrink-0">
            Set up →
          </Link>
        </div>
      )}

      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Overview</h2>
        <p className="text-sm text-stone-500">Your brand at a glance</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total Orders" value={orders.length}
          icon={<ShoppingCart size={17} className="text-brand-300" />}
          colorClass="bg-brand-900/50 border border-brand-800/30" />
        <Stat label="Revenue" value={`$${(revenue / 100).toFixed(2)}`} sub="After platform fee"
          icon={<TrendingUp size={17} className="text-green-800" />}
          colorClass="bg-green-900/30 border border-green-800/30" />
        <Stat label="Pending" value={pending} sub="Awaiting action"
          icon={<AlertCircle size={17} className="text-amber-600" />}
          colorClass="bg-amber-900/30 border border-amber-800/30" />
        <Stat label="Dispatched" value={dispatch} sub="In transit"
          icon={<Package size={17} className="text-blue-600" />}
          colorClass="bg-blue-900/30 border border-blue-800/30" />
      </div>

      {/* Recent orders */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-medium">Recent Orders</h3>
          <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-500">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-12 text-center text-stone-500 text-sm">No orders yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-3/40 transition-colors">
                <div>
                  <p className="text-sm font-mono text-stone-500">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-stone-600">
                    {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(o.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${o.status}`}>{o.status}</span>
                  <p className="text-sm font-medium text-stone-500 w-20 text-right">${(o.totalAmount / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
