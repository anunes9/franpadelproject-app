import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AuthBackdrop } from '../../components/AuthBackdrop'
import { buttonClass } from '../../components/ui'

interface Props {
  errors: { base?: string }
}

export default function Login({ errors }: Props) {
  const { t } = useTranslation()
  // Nested under `user` because Devise's SessionsController reads
  // credentials from params[:user][:email] / params[:user][:password].
  const { data, setData, post, processing } = useForm({
    user: { email: '', password: '' },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    post('/users/sign_in')
  }

  return (
    <AuthBackdrop>
      <form onSubmit={handleSubmit} className={AUTH_CARD_CLASS}>
        {errors.base && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {errors.base === 'invalid_credentials' ? t('auth.login.invalidCredentials') : errors.base}
          </p>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('auth.login.emailLabel')}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={data.user.email}
            onChange={(e) => setData('user', { ...data.user, email: e.target.value })}
            className={AUTH_INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t('auth.login.passwordLabel')}
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            value={data.user.password}
            onChange={(e) => setData('user', { ...data.user, password: e.target.value })}
            className={AUTH_INPUT_CLASS}
          />
        </label>
        <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
          {processing ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>
    </AuthBackdrop>
  )
}
