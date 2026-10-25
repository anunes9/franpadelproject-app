import { useForm, usePage } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { breakPeriodPath, clubBreakPeriodsPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, Eyebrow, FieldError, INPUT_CLASS } from '../../components/ui'
import type { BreakPeriod, ClubSummary } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  breakPeriod: BreakPeriod | null
}

type Field = 'name' | 'starts_on' | 'ends_on'

function Form() {
  const { club, breakPeriod } = usePage<Props>().props
  const { t } = useTranslation()
  const breakPeriodsHref = clubBreakPeriodsPath(club.id)

  const { data, setData, post, patch, transform, processing, errors } = useForm({
    name: breakPeriod?.name ?? '',
    starts_on: breakPeriod?.startsOn ?? '',
    ends_on: breakPeriod?.endsOn ?? '',
  })
  transform((fields) => ({ break_period: fields }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (breakPeriod) {
      patch(breakPeriodPath(breakPeriod.id))
    } else {
      post(breakPeriodsHref)
    }
  }

  // Our copy, in the Client's language, for the error codes each field knows.
  function errorFor(field: Field) {
    const copy =
      field === 'name'
        ? { blank: t('breakPeriods.form.errors.name') }
        : {
            blank: t('breakPeriods.form.errors.date'),
            on_or_after_start: t('breakPeriods.form.errors.endsBeforeStart'),
          }
    return <FieldError errors={errors} field={field} copy={copy} />
  }

  const dates: Array<{ field: Exclude<Field, 'name'>; label: string }> = [
    { field: 'starts_on', label: t('breakPeriods.form.startsOn') },
    { field: 'ends_on', label: t('breakPeriods.form.endsOn') },
  ]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[640px] flex-col gap-6 lg:mx-auto">
        <BackLink label={t('breakPeriods.form.backToBreakPeriods')} href={breakPeriodsHref} />
        <div className="flex flex-col gap-1">
          <Eyebrow>{club.name}</Eyebrow>
          <PageHeader title={breakPeriod ? t('breakPeriods.form.editTitle') : t('breakPeriods.form.newTitle')} />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t('breakPeriods.form.name')}
            <input
              type="text"
              value={data.name}
              onChange={(event) => setData('name', event.target.value)}
              placeholder={t('breakPeriods.form.namePlaceholder')}
              aria-invalid={errors.name ? true : undefined}
              autoComplete="off"
              className={INPUT_CLASS}
            />
            {errorFor('name')}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {dates.map(({ field, label }) => (
              <label key={field} className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                {label}
                <input
                  type="date"
                  value={data[field]}
                  onChange={(event) => setData(field, event.target.value)}
                  min={field === 'ends_on' ? data.starts_on || undefined : undefined}
                  aria-invalid={errors[field] ? true : undefined}
                  className={`${INPUT_CLASS} min-h-11`}
                />
                {errorFor(field)}
              </label>
            ))}
          </div>

          <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
            {processing ? t('breakPeriods.form.saving') : t('breakPeriods.form.save')}
          </button>
        </form>
      </div>
    </div>
  )
}

Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Form
