'use client'

import { useEffect, useRef } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@clerk/nextjs'
import { orderApi } from '@/lib/api'
import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleCheckout = async () => {
    if (!items.length) return
    setLoading(true)
    setError('')

    try {
      const token = await getToken()
      if (!token) {
        window.location.href = '/sign-in'
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/checkout/cart`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: items.map(i => ({
              productId: i.product.id,
              quantity:  i.quantity,
            })),
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message ?? 'Checkout failed')
      }

      const { checkoutUrls, totalSessions } = await response.json()

      clearCart()

      if (totalSessions === 1) {
        window.location.href = checkoutUrls[0]
      } else {
        sessionStorage.setItem('pendingCheckouts', JSON.stringify(checkoutUrls.slice(1)))
        window.location.href = checkoutUrls[0]
      }
    } catch (err: any) {
      setError(err.message ?? 'Checkout failed. Please try again.')
      setLoading(false)
    }
  } 

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4d9ea]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand-600" />
            <h2 className="font-display text-lg font-semibold text-[#2d1f35]">
              Your Cart
            </h2>
            {totalItems() > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-medium">
                {totalItems()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-[#6b4f7a] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <ShoppingBag size={48} className="text-brand-200 mb-4" />
              <p className="text-[#6b4f7a] font-medium mb-1">Your cart is empty</p>
              <p className="text-[#a08aad] text-sm">Add some products to get started</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-brand-600 underline underline-offset-2"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 p-3 bg-surface-1 rounded-xl border border-[#e4d9ea]"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    : <ShoppingBag size={24} className="m-auto mt-4 text-brand-300" />
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2d1f35] leading-snug truncate">
                    {product.name}
                  </p>
                  {product.brand && (
                    <p className="text-xs text-[#a08aad] mb-2">{product.brand.name}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-white border border-[#e4d9ea] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#6b4f7a] hover:bg-surface-2 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-[#2d1f35]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-7 h-7 flex items-center justify-center text-[#6b4f7a] hover:bg-surface-2 disabled:opacity-40 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-700">
                        ${((product.price * quantity) / 100).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="w-6 h-6 flex items-center justify-center text-[#a08aad] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#e4d9ea] bg-white space-y-3">
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6b4f7a]">Subtotal ({totalItems()} items)</span>
              <span className="font-display font-semibold text-[#2d1f35] text-lg">
                ${(totalPrice() / 100).toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#a08aad]">
              Shipping and taxes calculated at checkout
            </p>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : <>Checkout <ArrowRight size={16} /></>
              }
            </button>

            <button
              onClick={clearCart}
              className="w-full text-xs text-[#a08aad] hover:text-red-500 transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}