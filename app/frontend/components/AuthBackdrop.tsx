import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'

// The signed-out pages' look: the academy teaser video behind the logo and a
// centred card. Used by sign-in and by accepting a Coach invitation.
export function AuthBackdrop({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

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
          {children}
        </div>
      </div>
    </div>
  )
}

// The white card the signed-out forms sit in.
export const AUTH_CARD_CLASS = 'flex flex-col gap-4 rounded-2xl bg-white/95 p-6 shadow-float backdrop-blur-sm'

export const AUTH_INPUT_CLASS =
  'rounded-lg border border-line px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30'
