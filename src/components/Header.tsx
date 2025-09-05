'use client'

import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export default function Header() {
  const router = useRouter()
  const { user, userProfile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      const { error } = await signOut()

      if (error) {
        console.error('Logout error:', error)
        return
      }

      // Redirect to home page after successful logout
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
              prefetch={false}
            >
              <Image src="/fran-methodology-logo.png" alt="Fran Methodology" width={160} height={160} />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/profile" prefetch={false} className="flex items-center space-x-2">
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="User Avatar" width={28} height={28} />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{userProfile?.full_name || user?.email || 'Profile'}</span>
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
