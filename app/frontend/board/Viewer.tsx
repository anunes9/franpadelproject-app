// An Exercise's Board on its page: the court to watch, Step by Step, with
// each Step's caption, and nothing to change.

import { ArrowLeft01Icon, ArrowRight01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from '@/i18n/useTranslation'
import { BoardLocaleContext } from './Court'
import type { BoardDocument } from './document'
import { localize } from './document'
import { BoardPreview } from './Preview'
import { BarButton } from './Toolbar'
import { useStepPlayer } from './useStepPlayer'

export function BoardViewer({ doc, title }: { doc: BoardDocument; title: string }) {
  const { t, locale } = useTranslation()
  const { stepIndex, frame, animating, playing, next, previous, play, stop } = useStepPlayer(doc)
  const caption = localize(doc.steps[stepIndex].caption, locale)
  const several = doc.steps.length > 1

  return (
    <figure className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
      <div className="aspect-[57/32] w-full bg-paper p-2">
        <BoardLocaleContext.Provider value={locale}>
          <BoardPreview
            doc={doc}
            stepIndex={stepIndex}
            frame={frame}
            label={t('boards.viewer.label', { title, step: stepIndex + 1, count: doc.steps.length })}
          />
        </BoardLocaleContext.Provider>
      </div>
      {(several || caption) && (
        <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-2 py-1.5">
          {several && (
            <div className="flex items-center gap-1">
              <BarButton onClick={previous} disabled={animating || stepIndex === 0} label={t('boards.steps.previous')}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} />
              </BarButton>
              <span
                className="min-w-24 text-center font-dash-mono text-meta font-semibold tabular-nums"
                aria-live="polite"
              >
                {t('boards.steps.position', { step: stepIndex + 1, count: doc.steps.length })}
              </span>
              <BarButton
                onClick={next}
                disabled={animating || stepIndex >= doc.steps.length - 1}
                label={t('boards.steps.next')}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={1.8} />
              </BarButton>
              {playing ? (
                <BarButton onClick={stop} label={t('boards.steps.pause')} tone="primary">
                  <HugeiconsIcon icon={PauseIcon} size={18} strokeWidth={1.8} />
                  {t('boards.steps.pause')}
                </BarButton>
              ) : (
                <BarButton onClick={play} disabled={animating} label={t('boards.steps.play')} tone="primary">
                  <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={1.8} />
                  {t('boards.steps.play')}
                </BarButton>
              )}
            </div>
          )}
          {caption && <p className="min-w-0 flex-1 px-1 text-sm font-semibold text-ink">{caption}</p>}
        </figcaption>
      )}
    </figure>
  )
}
