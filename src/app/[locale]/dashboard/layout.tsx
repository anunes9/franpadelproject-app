'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-p-gray">
      <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex-1 items-start xl:grid xl:grid-cols-[260px_1fr] xl:gap-6 2xl:grid-cols-[300px_1fr] 2xl:gap-10 px-4 md:px-6 py-6 md:py-10">
        <aside className="fixed top-24 z-30 hidden h-[calc(100vh-8rem)] w-full shrink-0 xl:sticky xl:block">
          <div className="h-full rounded-3xl bg-white border border-p-gray/50 shadow-sm overflow-hidden">
            <DashboardSidebar />
          </div>
        </aside>

        <main className="flex w-full flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[300px] border-none">
          <div className="h-full bg-white">
            <div className="p-6 border-b border-p-gray">
              <img src="/fran-padel-project-logo.svg" alt="Fran Padel Project" className="h-10" />
            </div>
            <DashboardSidebar onItemClick={() => setIsSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
