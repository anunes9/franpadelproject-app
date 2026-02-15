'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Menu } from 'lucide-react'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('navigation')
  const { signOut, user, userProfile } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-p-gray bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden text-p-blue hover:text-p-blue/80 hover:bg-p-gray/50 rounded-full p-2 cursor-pointer"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2">
            <Image
              src="/fran-padel-project-logo.svg"
              alt="Fran Padel Project"
              width={100}
              height={32}
              className="hidden md:block"
            />
            <Image
              src="/fr-logo.svg"
              alt="FPP"
              width={32}
              height={32}
              className="md:hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 xl:gap-4">
          <LanguageSwitcher />

          <div className="h-8 w-[1px] bg-p-gray mx-1 hidden xl:block" />

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center mr-2">
              <span className="text-sm font-medium text-p-blue">
                {userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-p-green-light text-p-green hover:text-p-green hover:bg-p-green-light/80"
            >
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-p-blue hover:text-red-500 hover:bg-red-50"
              onClick={handleLogout}
              title={t('logout')}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
