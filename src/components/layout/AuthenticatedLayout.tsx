import { LogoutButton } from '@/components/layout/LogoutButton'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not authenticated, redirect to landing page
  if (!user) {
    redirect('/')
  }

  // Get user profile data
  const { data: userProfile } = await supabase.from('users').select().eq('id', user.id).single()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <Image src="/fran-logo.svg" alt="Fran Logo" width={120} height={48} />
          </Link>

          {/* User Info and Actions */}
          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name || user.email}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                {/* Mobile User Info */}
                <div className="md:hidden text-right">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name || user.email?.split('@')[0]}</p>
                </div>

                {/* Profile Button */}
                <Link
                  href="/profile"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>

                {/* Logout Button */}
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col justify-center items-center gap-4">
            <div className="flex justify-center items-center gap-6">
              <a href="https://franpadelproject.com" target="_blank" rel="noreferrer">
                <Image alt="fran-logo" src="/fran-logo.svg" height={36} width={36} />
              </a>
              <a href="https://anunes9.github.io/me/" target="_blank" rel="noreferrer">
                <Image alt="an-logo" src="/an-logo.svg" height={48} width={48} />
              </a>
            </div>
            <span className="text-gray-500 text-sm">© 2025 All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
