import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useForm } from '@inertiajs/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
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

  // The background video only starts on its own when the visitor hasn't asked
  // for reduced motion, and can always be paused (WCAG 2.2.2).
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    videoRef.current?.play().catch(() => {})
  }, [])

  function toggleVideo() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    post('/users/sign_in')
  }

  return (
    <div className="relative min-h-dvh overflow-hidden font-dash-sans">
      <div className="absolute inset-0 z-0 bg-ink">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setVideoPlaying(true)}
          onPause={() => setVideoPlaying(false)}
          className="h-full w-full object-cover"
        >
          <source
            src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <button
        type="button"
        onClick={toggleVideo}
        aria-label={videoPlaying ? t('auth.login.pauseVideo') : t('auth.login.playVideo')}
        className="absolute right-4 bottom-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
      >
        <HugeiconsIcon icon={videoPlaying ? PauseIcon : PlayIcon} size={18} strokeWidth={1.75} aria-hidden />
      </button>

      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1>
            <img
              src="/fran-padel-project-logo.svg"
              alt={t('auth.login.logoAlt')}
              width={260}
              height={200}
              className="mx-auto mb-8"
            />
          </h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl bg-white/95 p-6 shadow-float backdrop-blur-sm"
          >
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
                className="rounded-lg border border-line px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
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
                className="rounded-lg border border-line px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
              {processing ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
