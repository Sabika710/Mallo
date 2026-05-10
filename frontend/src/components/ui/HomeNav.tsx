'use client'
import Link from 'next/link'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { ShoppingBag } from 'lucide-react'

export function HomeNav() {
  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-5 border-b border-[#e4d9ea] bg-white">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
          <ShoppingBag size={14} className="text-[#6b4f7a]" />
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">Mallo</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/store" className="text-sm text-[#6b4f7a] hover:text-[#2d1f35] transition-colors">
          Browse
        </Link>

        {/* Clerk components must be inside a client component */}
        <SignedOut>
          <Link
            href="/sign-in"
            className="text-sm text-[#6b4f7a] hover:text-[#2d1f35] transition-colors"

          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-[#6b4f7a] font-medium transition-colors"
          >
            Join as Brand
          </Link>
        </SignedOut>

        <SignedIn>
          <Link
            href="/dashboard"
            className="text-sm px-4 py-2 rounded-lg glass glass-hover transition-colors"
          >
            Dashboard
          </Link>
          {/* z-index: UserButton dropdown must be above all backgrounds */}
          <div className="relative z-[9999]">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    </nav>
  )
}
