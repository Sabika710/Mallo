import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { OrgActivator } from '@/components/ui/OrgActivator'
import { BrandGuard } from '@/components/ui/BrandGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  return (
    <OrgActivator>
      <BrandGuard>
        <div className="flex h-screen bg-surface overflow-hidden">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </BrandGuard>
    </OrgActivator>
  )
}