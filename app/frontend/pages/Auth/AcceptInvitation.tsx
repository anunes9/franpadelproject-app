import { Link, useForm, usePage } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AuthBackdrop } from '../../components/AuthBackdrop'
import { buttonClass, type ErrorCopy, FieldError, fieldErrorText } from '../../components/ui'

interface Props {
  [key: string]: unknown
  // "pending" until the link is used; an "expired" or "accepted" link can
  // no longer be used.
  state: 'pending' | 'expired' | 'accepted'
  invitation: { name: string; email: string; club: string }
}

type Field = 'name' | 'password' | 'password_confirmation' | 'email'

function Closed({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation()
  return (
    <div className={AUTH_CARD_CLASS}>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
      <Link href="/users/sign_in" className={buttonClass('primary', 'mt-2')}>
        {t('coachInvitations.accept.goToSignIn')}
      </Link>
    </div>
  )
}

export default function AcceptInvitation() {
  const { props, url } = usePage<Props>()
  const { state, invitation } = props
  const { t } = useTranslation()

  const {
    data,
    setData,
    patch,
    transform,
    processing,
    errors: formErrors,
  } = useForm({
    name: invitation.name,
    password: '',
    password_confirmation: '',
  })
  transform((fields) => ({ invitation: fields }))
  // The email is not a field of the form, but the server can still refuse it.
  const errors: Partial<Record<Field, unknown>> = formErrors

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    patch(url)
  }

  // Our copy, in the Client's language, for the error codes each field knows.
  const password = t('coachInvitations.accept.errors.password')
  const ERROR_COPY: Record<Field, ErrorCopy> = {
    name: { blank: t('coachInvitations.accept.errors.name') },
    password: { blank: password, too_short: password },
    password_confirmation: { confirmation: t('coachInvitations.accept.errors.passwordConfirmation') },
    email: { account_exists: t('coachInvitations.accept.errors.emailTaken') },
  }

  function errorFor(field: Field) {
    return <FieldError errors={errors} field={field} copy={ERROR_COPY[field]} />
  }
  const emailError = fieldErrorText(errors, 'email', ERROR_COPY.email)

  if (state === 'expired') {
    return (
      <AuthBackdrop>
        <Closed title={t('coachInvitations.accept.expiredTitle')} body={t('coachInvitations.accept.expired')} />
      </AuthBackdrop>
    )
  }

  if (state === 'accepted') {
    return (
      <AuthBackdrop>
        <Closed title={t('coachInvitations.accept.acceptedTitle')} body={t('coachInvitations.accept.accepted')} />
      </AuthBackdrop>
    )
  }

  return (
    <AuthBackdrop>
      <form onSubmit={handleSubmit} noValidate className={AUTH_CARD_CLASS}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-ink">
            {t('coachInvitations.accept.title', { club: invitation.club })}
          </h2>
          <p className="text-sm text-muted">{t('coachInvitations.accept.intro')}</p>
        </div>

        {emailError ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {emailError}
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('coachInvitations.accept.email')}
          <input
            type="email"
            value={invitation.email}
            readOnly
            autoComplete="username"
            className={`${AUTH_INPUT_CLASS} bg-track/40 text-muted`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('coachInvitations.accept.name')}
          <input
            type="text"
            required
            autoComplete="name"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            className={AUTH_INPUT_CLASS}
          />
          {errorFor('name')}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('coachInvitations.accept.password')}
          <input
            type="password"
            required
            autoComplete="new-password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby="password-hint"
            className={AUTH_INPUT_CLASS}
          />
          <span id="password-hint" className="text-meta font-normal text-muted">
            {t('coachInvitations.accept.passwordHint')}
          </span>
          {errorFor('password')}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('coachInvitations.accept.passwordConfirmation')}
          <input
            type="password"
            required
            autoComplete="new-password"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            aria-invalid={errors.password_confirmation ? true : undefined}
            className={AUTH_INPUT_CLASS}
          />
          {errorFor('password_confirmation')}
        </label>
        <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
          {processing ? t('coachInvitations.accept.submitting') : t('coachInvitations.accept.submit')}
        </button>
      </form>
    </AuthBackdrop>
  )
}
