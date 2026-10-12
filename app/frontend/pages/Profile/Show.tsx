import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import type { Locale } from '@/types'
import { AppShell } from '../../components/shell'
import { buttonClass } from '../../components/ui'

interface Profile {
  name: string
  initials: string
  email: string
  role: string
  age: number | null
  level: string | null
  hand: string | null
  club: string | null
  memberSince: string
}

interface Props {
  [key: string]: unknown
  profile: Profile
  levelOptions: string[]
  handOptions: string[]
}

function Show() {
  const { profile, levelOptions, handOptions } = usePage<Props>().props
  const { t, locale } = useTranslation()

  const levelLabels: Record<string, string> = {
    beginner: t('profile.show.levelOption.beginner'),
    intermediate: t('profile.show.levelOption.intermediate'),
    advanced: t('profile.show.levelOption.advanced'),
  }
  const handLabels: Record<string, string> = {
    left: t('profile.show.handOption.left'),
    right: t('profile.show.handOption.right'),
  }

  const topRows: Array<[string, string]> = [
    [t('profile.show.rowLabel.email'), profile.email],
    [t('profile.show.rowLabel.age'), profile.age ? String(profile.age) : t('profile.show.emptyValue')],
  ]
  const bottomRows: Array<[string, string]> = [
    [t('profile.show.rowLabel.club'), profile.club ?? t('profile.show.emptyValue')],
  ]

  function handleLogout() {
    router.delete('/users/sign_out')
  }

  function handleLocaleChange(next: Locale) {
    router.patch('/locale', { locale: next }, { preserveScroll: true })
  }

  function handleProfileFieldChange(field: 'level' | 'hand', value: string) {
    router.patch('/dashboard/profile', { [field]: value }, { preserveScroll: true })
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-ink-soft to-ink text-xl font-bold text-paper shadow-card-dark lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink lg:text-title">{profile.name}</h1>
            <div className="mt-0.5 text-meta text-muted lg:text-sm">
              {profile.club ? `${profile.club} · ` : ''}
              {t('profile.show.memberSince', {
                date: new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(`${profile.memberSince}T12:00:00`)),
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2 shadow-card">
          {topRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
          <label className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0">
            <span className="text-sm text-muted">{t('profile.show.rowLabel.level')}</span>
            <select
              value={profile.level?.toLowerCase() ?? ''}
              onChange={(event) => handleProfileFieldChange('level', event.target.value)}
              className="-my-2 min-h-11 bg-transparent text-right text-base text-ink lg:text-sm"
            >
              {!profile.level && <option value="" disabled />}
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {levelLabels[option] ?? option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0">
            <span className="text-sm text-muted">{t('profile.show.rowLabel.hand')}</span>
            <select
              value={profile.hand?.toLowerCase() ?? ''}
              onChange={(event) => handleProfileFieldChange('hand', event.target.value)}
              className="-my-2 min-h-11 bg-transparent text-right text-base text-ink lg:text-sm"
            >
              {!profile.hand && <option value="" disabled />}
              {handOptions.map((option) => (
                <option key={option} value={option}>
                  {handLabels[option] ?? option}
                </option>
              ))}
            </select>
          </label>
          {bottomRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-b border-track py-3.5 last:border-0">
            <span className="text-sm text-muted">{t('profile.show.language')}</span>
            <div className="flex gap-1 rounded-full border border-line bg-paper p-0.5 shadow-well">
              {(['pt', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleLocaleChange(option)}
                  aria-pressed={locale === option}
                  lang={option}
                  className={
                    'rounded-full px-3 py-1 text-xs font-semibold uppercase transition-[background-color,box-shadow,color] duration-150 pointer-coarse:min-h-11 pointer-coarse:min-w-12 ' +
                    (locale === option ? 'bg-ink text-paper shadow-card-dark' : 'text-muted')
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" onClick={handleLogout} className={buttonClass('danger', 'w-full')}>
          {t('common.signOut')}
        </button>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
