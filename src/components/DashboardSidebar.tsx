'use client'

import { useTranslations } from 'next-intl'
import { LocaleLink } from './LocaleLink'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  GraduationCap, 
  Trophy, 
  Calendar, 
  Dumbbell, 
  User,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick?: () => void
}

function SidebarItem({ href, icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <LocaleLink
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-p-blue text-white shadow-lg shadow-p-blue/20" 
          : "text-p-blue/70 hover:bg-p-gray hover:text-p-blue"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "transition-colors",
          isActive ? "text-p-green" : "text-p-blue/50 group-hover:text-p-blue"
        )}>
          {icon}
        </div>
        <span className="font-medium text-sm md:text-base">{label}</span>
      </div>
      {isActive && <ChevronRight className="h-4 w-4 text-p-green" />}
    </LocaleLink>
  )
}

interface DashboardSidebarProps {
  onItemClick?: () => void
}

export function DashboardSidebar({ onItemClick }: DashboardSidebarProps) {
  const t = useTranslations('navigation')
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
    },
    {
      href: '/dashboard/beginner',
      icon: <GraduationCap className="h-5 w-5" />,
      label: t('beginner'),
    },
    {
      href: '/dashboard/intermediate',
      icon: <Trophy className="h-5 w-5" />,
      label: t('intermediate'),
    },
    {
      href: '/dashboard/exercises',
      icon: <Dumbbell className="h-5 w-5" />,
      label: t('exercises'),
    },
    {
      href: '/dashboard/weekly-planning',
      icon: <Calendar className="h-5 w-5" />,
      label: t('planning'),
    },
    {
      href: '/dashboard/certification',
      icon: <GraduationCap className="h-5 w-5" />,
      label: t('certification'),
    },
    {
      href: '/dashboard/profile',
      icon: <User className="h-5 w-5" />,
      label: t('profile'),
    },
  ]

  return (
    <aside className="flex flex-col gap-6 py-6 h-full overflow-y-auto px-4">
      <div className="px-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-p-blue/40 px-2 mb-4">
          Main Menu
        </h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            // Check if the current pathname matches the item href
            // We need to account for the locale prefix, e.g., /en/dashboard
            const isActive = pathname.endsWith(item.href) || 
                            (item.href !== '/dashboard' && pathname.includes(item.href))

            return (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                onClick={onItemClick}
              />
            )
          })}
        </nav>
      </div>

      <div className="mt-auto px-4 py-6 bg-p-green-light rounded-3xl mx-2">
        <h3 className="text-p-blue font-bold text-sm mb-1">Padel Academy</h3>
        <p className="text-p-blue/60 text-xs mb-3">Learn from the experts and become a pro player.</p>
        <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden">
          <div className="bg-p-green h-full w-[45%]" />
        </div>
        <p className="text-[10px] text-p-blue/40 mt-2 font-medium uppercase tracking-tighter">45% Course Complete</p>
      </div>
    </aside>
  )
}
