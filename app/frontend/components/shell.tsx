import {
  Book02Icon,
  Dumbbell02Icon,
  Home01Icon,
  Logout03Icon,
  User03Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { clubPlayersPath, isBreakPeriodsPath, isClubOverviewPath, isPlayersPath, selectedClubId } from '@/lib/paths'
import type { DashboardUser } from '../types/dashboard-data'

function useNav() {
  const { t } = useTranslation()
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  // Players follows the Club selected on the Club Manager home, and
  // otherwise opens on the user's first Club.
  const selectedId = selectedClubId(url)
  const playersClub = dashboardUser.clubs.find((club) => club.id === selectedId) ?? dashboardUser.clubs[0]
  const players = playersClub
    ? [
        {
          href: clubPlayersPath(playersClub.id),
          label: t('common.nav.players'),
          tab: t('common.nav.players'),
          icon: UserGroupIcon,
        },
      ]
    : []
  return [
    { href: '/dashboard', label: t('common.nav.dashboard'), tab: t('common.nav.dashboard'), icon: Home01Icon },
    { href: '/dashboard/courses', label: t('common.nav.courses'), tab: t('common.nav.courses'), icon: Book02Icon },
    {
      href: '/dashboard/exercises',
      label: t('common.nav.exercises'),
      tab: t('common.nav.exercises'),
      icon: Dumbbell02Icon,
    },
    ...players,
    { href: '/dashboard/profile', label: t('common.nav.profile'), tab: t('common.nav.profile'), icon: User03Icon },
  ]
}

// A Club Manager's home is their Club overview, so Dashboard stays active on
// it; the Players URL also starts with /dashboard/clubs/, so it is matched by
// shape rather than prefix.
const isActive = (pathname: string, item: { href: string }) => {
  if (item.href === '/dashboard')
    return pathname === '/dashboard' || isClubOverviewPath(pathname) || isBreakPeriodsPath(pathname)
  if (isPlayersPath(item.href)) return isPlayersPath(pathname)
  return pathname.startsWith(item.href)
}

function handleSignOut() {
  router.delete('/users/sign_out')
}

function Sidebar() {
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const { t } = useTranslation()
  const nav = useNav()

  return (
    <aside className="sticky top-0 z-10 hidden h-dvh w-64 shrink-0 flex-col gap-8 overflow-y-auto bg-gradient-to-b from-ink-soft to-ink px-5 py-7 shadow-rail lg:flex">
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
            aria-current={isActive(url, item) ? 'page' : undefined}
            className={
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ' +
              (isActive(url, item) ? 'bg-teal/15 text-paper shadow-lit-dark' : 'text-ink-mute hover:text-paper')
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
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-meta font-bold text-ink">
          {dashboardUser.initials}
        </div>
        <div>
          <div className="text-meta font-semibold text-paper">{dashboardUser.name}</div>
          {dashboardUser.club && <div className="text-xs text-ink-mute">{dashboardUser.club}</div>}
        </div>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const { t } = useTranslation()
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const onProfile = url.startsWith('/dashboard/profile')

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between bg-paper px-5 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link href="/dashboard" className="flex h-11 items-center">
        <img
          src="/fran-methodology-logo-cropped.png"
          alt={t('common.logoAlt.franMethodology')}
          width={444}
          height={117}
          className="h-7 w-auto"
        />
      </Link>
      <Link
        href="/dashboard/profile"
        aria-label={t('common.nav.profile')}
        aria-current={onProfile ? 'page' : undefined}
        className="-mr-1 flex h-11 w-11 items-center justify-center"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-xs font-extrabold text-ink">
          {dashboardUser.initials}
        </span>
      </Link>
    </header>
  )
}

function BottomTabs() {
  const { url } = usePage()
  const nav = useNav()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-dock lg:hidden">
      {nav.map((item) => {
        const on = isActive(url, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? 'page' : undefined}
            className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1"
          >
            <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.5} className={on ? 'text-ink' : 'text-muted'} />
            <span className={`truncate text-label font-semibold tracking-normal ${on ? 'text-ink' : 'text-muted'}`}>
              {item.tab}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// The document scrolls (not an inner container), so mobile browser chrome can
// collapse, anchors and scroll restoration work, and body scroll-lock in modals
// takes effect. The sidebar stays put by being sticky and viewport-tall.
//
// Detail pages (module, exercise) draw their own back / title row, so they
// pass `mobileHeader={false}` to drop the logo bar on small screens.
export function AppShell({ children, mobileHeader = true }: { children: ReactNode; mobileHeader?: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh bg-paper font-dash-sans">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[max(0.75rem,env(safe-area-inset-top))] focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-paper focus:shadow-float"
      >
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {mobileHeader && <MobileHeader />}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] focus:outline-none lg:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}

export function PageHeader({ title }: { title: string }) {
  return <h1 className="text-balance text-title font-bold text-ink lg:text-title-lg">{title}</h1>
}
