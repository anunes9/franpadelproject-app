import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { useTranslation } from '@/i18n/useTranslation'

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="h-full w-full object-cover">
          <source
            src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <img
            src="/fran-padel-project-logo.svg"
            alt={t('auth.login.logoAlt')}
            width={260}
            height={200}
            className="mx-auto mb-8"
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-6">
            {errors.base && (
              <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {errors.base === 'invalid_credentials' ? t('auth.login.invalidCredentials') : errors.base}
              </p>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t('auth.login.emailLabel')}
              <input
                type="email"
                value={data.user.email}
                onChange={(e) => setData('user', { ...data.user, email: e.target.value })}
                className="rounded-lg border border-line px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t('auth.login.passwordLabel')}
              <input
                type="password"
                value={data.user.password}
                onChange={(e) => setData('user', { ...data.user, password: e.target.value })}
                className="rounded-lg border border-line px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <button
              type="submit"
              disabled={processing}
              className="mt-2 rounded-full bg-ink py-3 text-[15px] font-semibold text-paper disabled:opacity-60"
            >
              {processing ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
