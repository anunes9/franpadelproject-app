// A Coach's library of saved Boards, visible to them alone (ADR 0010), and
// the way into a new, scratch Board.
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { boardPath, newBoardPath } from '@/lib/paths'
import type { SavedBoard } from '../../board/BoardScreen'
import { parseBoard } from '../../board/document'
import { BoardPreview } from '../../board/Preview'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass } from '../../components/ui'

interface Props {
  [key: string]: unknown
  boards: SavedBoard[]
}

// "31 Oct 2026", in the Coach's language and time zone.
function formatChanged(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function BoardCard({ board }: { board: SavedBoard }) {
  const { t, tn, locale } = useTranslation()
  const doc = parseBoard(board.document)

  function handleDelete() {
    if (!window.confirm(t('boards.index.confirmDelete', { title: board.title }))) return
    router.delete(boardPath(board.id), { preserveScroll: true })
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <Link href={boardPath(board.id)} className="group flex flex-col">
        <div className="aspect-[57/32] bg-paper p-2">
          {doc && <BoardPreview doc={doc} label={t('boards.index.preview', { title: board.title })} />}
        </div>
        <div className="flex flex-col gap-0.5 px-4 pt-3">
          <span className="truncate text-base font-semibold text-ink group-hover:underline">{board.title}</span>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 pb-2">
        <span className="text-meta text-muted">
          {doc ? `${tn('boards.index.steps', doc.steps.length)} · ` : ''}
          {t('boards.index.changed', { date: formatChanged(board.updatedAt, locale) })}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={t('boards.index.delete', { title: board.title })}
          title={t('boards.index.delete', { title: board.title })}
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-danger hover:bg-tint-clay"
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
        </button>
      </div>
    </li>
  )
}

function Index() {
  const { boards } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[1080px] flex-col gap-6 lg:mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader title={t('boards.index.title')} />
          <Link href={newBoardPath} className={buttonClass('primary')}>
            {t('boards.index.new')}
          </Link>
        </div>
        <p className="max-w-[640px] text-sm text-muted">{t('boards.index.intro')}</p>

        {boards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong/40 bg-white px-6 py-10 text-center text-sm text-muted">
            {t('boards.index.empty')}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
