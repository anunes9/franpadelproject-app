import { useForm, usePage } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { clubCoachInvitationsPath, clubPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, Eyebrow, FieldError, INPUT_CLASS } from '../../components/ui'
import type { ClubSummary } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
}

type Field = 'name' | 'email'

function New() {
  const { club } = usePage<Props>().props
  const { t } = useTranslation()

  const { data, setData, post, transform, processing, errors } = useForm({ name: '', email: '' })
  transform((fields) => ({ coach_invitation: fields }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    post(clubCoachInvitationsPath(club.id))
  }

  // Our copy, in the Client's language, for the error codes each field knows.
  function errorFor(field: Field) {
    const copy =
      field === 'name'
        ? { blank: t('coachInvitations.new.errors.name') }
        : {
            blank: t('coachInvitations.new.errors.email'),
            invalid: t('coachInvitations.new.errors.email'),
            account_exists: t('coachInvitations.new.errors.emailTaken'),
          }
    return <FieldError errors={errors} field={field} copy={copy} />
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[640px] flex-col gap-6 lg:mx-auto">
        <BackLink label={t('coachInvitations.new.backToClub')} href={clubPath(club.id)} />
        <div className="flex flex-col gap-1">
          <Eyebrow>{club.name}</Eyebrow>
          <PageHeader title={t('coachInvitations.new.title')} />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
        >
          <p className="text-sm text-muted">{t('coachInvitations.new.intro', { club: club.name })}</p>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t('coachInvitations.new.name')}
            <input
              type="text"
              value={data.name}
              onChange={(event) => setData('name', event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              autoComplete="off"
              className={INPUT_CLASS}
            />
            {errorFor('name')}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t('coachInvitations.new.email')}
            <input
              type="email"
              value={data.email}
              onChange={(event) => setData('email', event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="off"
              className={INPUT_CLASS}
            />
            {errorFor('email')}
          </label>

          <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
            {processing ? t('coachInvitations.new.submitting') : t('coachInvitations.new.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

New.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default New
