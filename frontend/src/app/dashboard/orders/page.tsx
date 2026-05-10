'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, Truck, Package, CheckCircle, XCircle } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import type { Order, OrderStatus } from '@/lib/api'

const STATUS_LIST: OrderStatus[] = ['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELED']

const STATUS_META: Record<OrderStatus, { cls: string; icon: React.ReactNode }> = {
  PENDING:    { cls: 'badge-PENDING',    icon: <Package      size={11} /> },
  DISPATCHED: { cls: 'badge-DISPATCHED', icon: <Truck        size={11} /> },
  DELIVERED:  { cls: 'badge-DELIVERED',  icon: <CheckCircle  size={11} /> },
  CANCELED:   { cls: 'badge-CANCELED',   icon: <XCircle      size={11} /> },
}

export default function OrdersPage() {
  const { call } = useApi()
  const [orders,   setOrders]   = useState<Order[]>([])
  const [filter,   setFilter]   = useState<OrderStatus | 'ALL'>('ALL')
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try { setOrders(await call<Order[]>('orders')) }
    finally { setLoading(false) }
  }, [call])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id)
    try {
      await call<Order>(`orders/${id}/status`, { method: 'PATCH', body: { status } })
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } finally { setUpdating(null) }
  }

  const shown = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Orders</h2>
          <p className="text-sm text-stone-500">{orders.length} total</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-sm text-stone-500 hover:text-stone-400 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', ...STATUS_LIST] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-brand-700/60 text-brand-200 border border-brand-600/50'
                : 'bg-surface-3 border border-white/10 text-stone-500 hover:text-stone-400'
            }`}>
            {s === 'ALL' ? 'All' : s}
            {s !== 'ALL' && <span className="ml-1.5 opacity-50">{orders.filter(o => o.status === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={26} /></div>
        ) : shown.length === 0 ? (
          <p className="py-20 text-center text-stone-500 text-sm">No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Order', 'Date', 'Amount', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-stone-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shown.map(o => {
                  const meta = STATUS_META[o.status]
                  const canUpdate = o.status !== 'CANCELED' && o.status !== 'DELIVERED'
                  return (
                    <tr key={o.id} className="hover:bg-surface-3/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-stone-400 text-xs">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-stone-500">
                        {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(o.createdAt))}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-500">${(o.totalAmount / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
                          {meta.icon} {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canUpdate && (
                          <div className="flex items-center gap-2">
                            <select
                              value={o.status}
                              disabled={updating === o.id}
                              onChange={e => updateStatus(o.id, e.target.value as OrderStatus)}
                              className="bg-surface-3 border border-white/10 rounded-lg px-2 py-1 text-xs text-stone-500 focus:outline-none focus:border-brand-600 cursor-pointer disabled:opacity-50"
                            >
                              {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {updating === o.id && <Loader2 size={13} className="animate-spin text-brand-400" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
