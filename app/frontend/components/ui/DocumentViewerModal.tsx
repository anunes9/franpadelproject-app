import { useEffect } from 'react'
import type { CourseDocument } from '../../types/dashboard-data'

interface Props {
  document: CourseDocument
  onClose: () => void
  closeLabel: string
}

export function DocumentViewerModal({ document: doc, onClose, closeLabel }: Props) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.filename}
      className="fixed inset-0 z-50 flex flex-col bg-ink/70 p-3 lg:p-8"
    >
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="truncate text-sm font-semibold text-ink">{doc.filename}</span>
          <button
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
