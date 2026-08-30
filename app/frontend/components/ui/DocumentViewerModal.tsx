import { useEffect, useRef } from 'react'
import type { CourseDocument } from '../../types/dashboard-data'

interface Props {
  document: CourseDocument
  onClose: () => void
  closeLabel: string
}

const FOCUSABLE_SELECTOR = 'button, a[href], [tabindex]:not([tabindex="-1"]), iframe, video'

export function DocumentViewerModal({ document: doc, onClose, closeLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !containerRef.current) return

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [onClose])

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={doc.filename}
      className="fixed inset-0 z-50 flex flex-col bg-ink/70 p-3 lg:p-8"
    >
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="truncate text-sm font-semibold text-ink">{doc.filename}</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-mist hover:text-ink"
          >
            {closeLabel}
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-mist">
          {doc.contentType === 'application/pdf' ? (
            <iframe
              src={`${doc.url}#toolbar=0&navpanes=0`}
              title={doc.filename}
              className="h-full w-full"
            />
          ) : doc.contentType.startsWith('image/') ? (
            <img src={doc.url} alt={doc.filename} className="mx-auto max-h-full max-w-full object-contain" />
          ) : doc.contentType.startsWith('video/') ? (
            // biome-ignore lint/a11y/useMediaCaption: user-uploaded module video, no caption track available
            <video src={doc.url} controls controlsList="nodownload" className="h-full w-full" />
          ) : (
            <iframe src={doc.url} title={doc.filename} className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  )
}
