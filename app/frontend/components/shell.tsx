import {
  Book02Icon,
  Calendar03Icon,
  Dumbbell02Icon,
  Home01Icon,
  Logout03Icon,
  User03Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import type { DashboardUser } from '../types/dashboard-data'

function useNav() {
  const { t } = useTranslation()
  return [
    { href: '/dashboard', label: t('common.nav.dashboard'), tab: t('common.nav.home'), icon: Home01Icon },
    { href: '/dashboard/courses', label: t('common.nav.courses'), tab: t('common.nav.courses'), icon: Book02Icon },
    {
      href: '/dashboard/exercises',
      label: t('common.nav.exercises'),
      tab: t('common.nav.exercises'),
      icon: Dumbbell02Icon,
    },
    { href: '/dashboard/plan', label: t('common.nav.weeklyPlan'), tab: t('common.nav.plan'), icon: Calendar03Icon },
    { href: '/dashboard/profile', label: t('common.nav.profile'), tab: t('common.nav.profile'), icon: User03Icon },
  ]
}

const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

function handleSignOut() {
  router.delete('/users/sign_out')
}

function Sidebar() {
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const { t } = useTranslation()
  const nav = useNav()

  return (
    <aside className="relative z-10 hidden w-64 shrink-0 flex-col gap-8 bg-gradient-to-b from-ink-soft to-ink px-5 py-7 shadow-[8px_0_28px_-16px_rgba(4,10,18,0.4)] lg:flex">
      <img
        src="/fran-methodology-logo.png"
        alt={t('common.logoAlt.franMethodology')}
        className="h-auto w-auto brightness-0 invert opacity-95"
      />
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ' +
              (isActive(url, item.href)
                ? 'bg-teal/15 text-paper shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                : 'text-ink-mute hover:text-paper')
            }
          >
            <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.5} className="shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-lg bg-danger px-3 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-danger/90"
        >
          <HugeiconsIcon icon={Logout03Icon} size={18} strokeWidth={1.5} className="shrink-0" />
          {t('common.signOut')}
        </button>
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {dashboardUser.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{dashboardUser.name}</div>
          {dashboardUser.club && <div className="text-[11px] text-muted">{dashboardUser.club}</div>}
        </div>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const { props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const { t } = useTranslation()

  return (
    <div className="flex h-12 items-center justify-between border-b border-line/80 bg-paper p-2 lg:hidden">
      <img src="/fran-methodology-logo.png" alt={t('common.logoAlt.franMethodology')} className="h-20 w-auto" />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
        {dashboardUser.initials}
      </div>
    </div>
  )
}

function BottomTabs() {
  const { url } = usePage()
  const nav = useNav().filter((n) => n.href !== '/dashboard/plan')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-5 pt-2.5 pb-2 shadow-dock lg:hidden">
      {nav.map((item) => {
        const on = isActive(url, item.href)
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1">
            <HugeiconsIcon
              icon={item.icon}
              size={20}
              strokeWidth={1.5}
              className={on ? 'text-ink' : 'text-line-strong'}
            />
            <span className={`text-[11px] font-semibold ${on ? 'text-ink' : 'text-line-strong'}`}>{item.tab}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-paper font-dash-sans">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto pb-28">
        <MobileHeader />
        {children}
      </main>
      <BottomTabs />
    </div>
  )
}

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">{eyebrow}</div>}

        <h1 className="mt-1.5 text-[27px] font-bold tracking-[-0.02em] text-ink lg:text-[34px] lg:tracking-[-0.025em]">
          {title}
        </h1>
      </div>
    </div>
  )
}
