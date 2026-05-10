'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Check, ShoppingBag } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import type { Product } from '@/lib/api'

type Form = { name: string; description: string; price: string; stock: string; imageUrl: string }
const EMPTY: Form = { name: '', description: '', price: '', stock: '', imageUrl: '' }

export default function ProductsPage() {
  const { call } = useApi()
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Product | null>(null)
  const [form,     setForm]     = useState<Form>(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setProducts(await call<Product[]>('products/mine/list')) }
    finally { setLoading(false) }
  }, [call])

  useEffect(() => { fetch() }, [fetch])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit   = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description, price: (p.price / 100).toString(), stock: p.stock.toString(), imageUrl: p.imageUrl ?? '' })
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const body = { name: form.name, description: form.description, price: Math.round(parseFloat(form.price) * 100), stock: parseInt(form.stock), imageUrl: form.imageUrl || undefined }
      if (editing) {
        const updated = await call<Product>(`products/${editing.id}`, { method: 'PATCH', body })
        setProducts(prev => prev.map(p => p.id === editing.id ? updated : p))
      } else {
        const created = await call<Product>('products', { method: 'POST', body })
        setProducts(prev => [...prev, created])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeleting(id)
    try {
      await call(`products/${id}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(p => p.id !== id))
    } finally { setDeleting(null) }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Products</h2>
          <p className="text-sm text-stone-500">{products.length} in catalog</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-[#6b4f7a] text-sm font-medium transition-colors">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={26} /></div>
      ) : products.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <p className="text-stone-400 text-sm mb-3">No products yet</p>
          <button onClick={openCreate} className="text-brand-400 text-sm underline underline-offset-2">Add your first product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden group">
              <div className="h-40 bg-surface-3 flex items-center justify-center overflow-hidden">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <ShoppingBag size={36} className="text-stone-700" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-[#6b4f7a] leading-snug">{p.name}</h3>
                  <p className="font-display font-semibold text-brand-400 text-lg flex-shrink-0">${(p.price / 100).toFixed(2)}</p>
                </div>
                <p className="text-xs text-stone-500 mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Stock: <span className={p.stock < 10 ? 'text-amber-400' : 'text-stone-400'}>{p.stock}</span></span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-surface-4 hover:bg-surface-3 text-stone-400 hover:text-stone-400 transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => remove(p.id)} disabled={deleting === p.id} className="p-1.5 rounded-lg bg-surface-4 hover:bg-red-900/50 text-stone-400 hover:text-red-400 transition-colors">
                      {deleting === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center p-4">
          <div className="glass bg-surface-2 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowForm(false)} className="text-stone-500 hover:text-stone-300"><X size={17} /></button>
            </div>
            <div className="space-y-3">
              {([
                { label: 'Name',              key: 'name',        type: 'text',   ph: 'e.g. Premium Sneakers' },
                { label: 'Description',       key: 'description', type: 'text',   ph: 'Brief description' },
                { label: 'Price (USD)',        key: 'price',       type: 'number', ph: '29.99' },
                { label: 'Stock',             key: 'stock',       type: 'number', ph: '100' },
                { label: 'Image URL (opt.)',   key: 'imageUrl',    type: 'url',    ph: 'https://…' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-stone-400 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={form[f.key]} onChange={set(f.key)}
                    className="w-full bg-surface-3 border border-white/10 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-brand-600 transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-stone-400 hover:text-stone-200 transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.price}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
