import Header from '@/components/Header'
import BackToTop from '@/components/BackToTop'
import Footer from '@/components/Footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      <main className="max-w-screen-xl min-h-[calc(100vh-9rem)] mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <Footer />
      <BackToTop />
    </div>
  )
}
