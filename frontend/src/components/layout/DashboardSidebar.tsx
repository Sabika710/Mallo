'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Settings, Store, ShoppingBag, ArrowLeft } from 'lucide-react'

const NAV = [
  { href: '/dashboard',          label: 'Overview',  Icon: LayoutDashboard },
  { href: '/dashboard/orders',   label: 'Orders',    Icon: ShoppingCart },
  { href: '/dashboard/products', label: 'Products',  Icon: Package },
  { href: '/dashboard/settings', label: 'Settings',  Icon: Settings },
]

export function DashboardSidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-1 border-r border-[#e4d9ea]">

      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#e4d9ea]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
          <ShoppingBag size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2d1f35]">Mallo</p>
          <p className="text-xs text-[#a08aad]">Brand Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-100 text-brand-700 border border-brand-200'
                  : 'text-[#6b4f7a] hover:text-[#2d1f35] hover:bg-surface-2'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/store"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-[#6b4f7a] transition-colors"
        >
          <Store size={15} />
          View Storefront
        </Link>
        <Link
         href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-[#6b4f7a] transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Home
       </Link>
      </div>      
    </aside>
  )
}
