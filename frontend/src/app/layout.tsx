import type { Metadata } from 'next'
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mallo — AI-Powered SaaS Mall',
  description: 'A curated multi-brand marketplace with an AI concierge.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-[#2d1f35] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
