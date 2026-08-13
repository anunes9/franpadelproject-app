import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'

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
  profile: Profile
}

function Show() {
  const { profile } = usePage<Props>().props

  const rows: Array<[string, string]> = [
    ['Email', profile.email],
    ['Role', profile.role],
    ['Age', profile.age ? String(profile.age) : '—'],
    ['Level', profile.level ?? '—'],
    ['Hand', profile.hand ?? '—'],
    ['Club', profile.club ?? '—'],
  ]

  function handleLogout() {
    router.delete('/users/sign_out')
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-ink text-xl font-bold text-paper lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-[21px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">{profile.name}</h1>
            <div className="mt-0.5 text-[13px] text-muted lg:text-sm">
              {profile.club ? `${profile.club} · ` : ''}Member since {profile.memberSince}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0">
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
