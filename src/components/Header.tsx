'use client'

import { Button } from '@/components/ui/button'
import { User, LogOut, BookOpen, Dumbbell, Award, Calendar } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { usePathname, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()
  const t = useTranslations()

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

  const navigationItems = [
    { href: '/dashboard/beginner', label: t('navigation.beginner'), icon: BookOpen },
    { href: '/dashboard/intermediate', label: t('navigation.intermediate'), icon: BookOpen },
    { href: '/dashboard/weekly-planning', label: t('navigation.planning'), icon: Calendar },
    { href: '/dashboard/exercises', label: t('navigation.exercises'), icon: Dumbbell },
    { href: '/dashboard/certification', label: t('navigation.certification'), icon: Award },
  ]

  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <LocaleLink
              href="/dashboard"
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
              prefetch={false}
            >
              <Image src="/fran-methodology-logo.png" alt="Fran Methodology" width={160} height={160} />
            </LocaleLink>
          </div>

          {/* Navigation Menu */}
          {/* <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className={isActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <LocaleLink href={item.href} prefetch={false} className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </LocaleLink>
                </Button>
              )
            })}
          </nav> */}

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <LocaleLink href="/dashboard/profile" prefetch={false} className="flex items-center space-x-2">
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="User Avatar" width={28} height={28} />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{userProfile?.full_name || user?.email || t('navigation.profile')}</span>
              </LocaleLink>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              {t('navigation.logout')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
