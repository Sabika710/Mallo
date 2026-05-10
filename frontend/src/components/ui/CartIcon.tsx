'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface Props {
  onClick: () => void
}

export function CartIcon({ onClick }: Props) {
  const { totalItems } = useCart()
  const count = totalItems()

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-1 border border-[#e4d9ea] hover:bg-surface-2 text-[#6b4f7a] hover:text-[#2d1f35] transition-colors"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingCart size={17} />
      <span className="text-sm font-medium hidden sm:block">Cart</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}