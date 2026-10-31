// A Board (Quadro): a full-screen padel court a Coach explains on, held up
// to a group on a tablet or phone (docs/specs/Boards.md, ADR 0010).
//
// A new Board is scratch: nothing reaches the server and it is kept in this
// browser until the Coach closes it, unless they save it into their library.
// A saved Board opens as it was saved; changes stay on screen until the Coach
// saves them again.

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  RedoIcon,
  UndoIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Head, router, usePage } from '@inertiajs/react'
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { boardPath, boardsPath } from '@/lib/paths'
import { fieldErrorText } from '../components/ui'
import { positionsBetween } from './animation'
import { BoardCanvas, type Selection, type Tool } from './Canvas'
import type { BoardDocument, Piece, PlayerLabel, ZoneFill } from './document'
import {
  addMark,
  clearInk,
  emptyBoard,
  hasInk,
  insertStepAfter,
  newId,
  parseBoard,
  placeable,
  removeMark,
  removePiece,
  removeStep,
  replaceMark,
  setCaption,
} from './document'
import type { BoardLabels, BoardView, Point } from './geometry'
import { PieceShape } from './glyphs'
import { useBoardHistory } from './history'
import { clearScratch, loadScratch, saveScratch } from './storage'
import { BarButton, Segmented, ToolButton, ToolGlyph } from './Toolbar'

// How long the pieces take to move from one Step to the next, and the pause
// between Steps when playing them all.
const STEP_MS = 1100
const PAUSE_MS = 500

type ToolChoice = 'select' | 'players' | 'ball' | 'cone' | 'ballPath' | 'arrow' | 'zone' | 'text' | 'ink'
const TOOL_CHOICES: ToolChoice[] = ['select', 'players', 'ball', 'cone', 'ballPath', 'arrow', 'zone', 'text', 'ink']

// Which of A–D or the Coach the Players tool places.
type PlayerChoice = PlayerLabel | 'P'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

// A Board's document as a request sends it, as JSON. It is plain data, but
// its interfaces have no index signature, which Inertia's payload type wants.
const payload = (doc: BoardDocument) => doc as unknown as Record<string, FormDataConvertible>

interface TextEdit {
  at: Point
  markId: string | null
  value: string
}

// A Board from the Coach's library, as the server sends it.
export interface SavedBoard {
  id: string
  title: string
  updatedAt: string
  document: unknown
}

// The name asked for when saving a Board, or when renaming a saved one.
interface TitleEdit {
  kind: 'save' | 'rename'
  value: string
}

export function BoardScreen({ saved }: { saved: SavedBoard | null }) {
  const { t } = useTranslation()
  const errors = (usePage().props.errors ?? {}) as Record<string, unknown>

  // A saved Board opens as it was saved; a new one as this browser kept it.
  // Read once: later props only tell what was saved since.
  const [opened] = useState(() => {
    if (!saved) return loadScratch()
    const document = parseBoard(saved.document)
    return document ? { doc: document, stepIndex: 0 } : null
  })
  const { doc, apply, undo, redo, canUndo, canRedo } = useBoardHistory(() => opened?.doc ?? emptyBoard())
  const [stepIndex, setStepIndex] = useState(opened?.stepIndex ?? 0)

  // The document as last saved. Undo hands back the very documents it kept,
  // so undoing to the saved Board counts as no change.
  const [savedDoc, setSavedDoc] = useState(() => (saved ? doc : null))
  const unsaved = saved !== null && doc !== savedDoc
  const [saving, setSaving] = useState(false)
  const [titleEdit, setTitleEdit] = useState<TitleEdit | null>(null)
  const step = doc.steps[Math.min(stepIndex, doc.steps.length - 1)]
  const currentStep = Math.min(stepIndex, doc.steps.length - 1)

  const [choice, setChoice] = useState<ToolChoice>('select')
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice>('A')
  const [zoneShape, setZoneShape] = useState<'rect' | 'circle'>('rect')
  const [zoneFill, setZoneFill] = useState<ZoneFill>('striped')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [textEdit, setTextEdit] = useState<TextEdit | null>(null)

  // Animating from one Step to the next: the Step it leaves and how far along.
  const [frame, setFrame] = useState<{ from: number; t: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const playingRef = useRef(false)
  const cancelRef = useRef<(() => void) | null>(null)

  const free = placeable(doc)
  const playerChoiceFree = playerChoice === 'P' ? free.coach : free.players.includes(playerChoice)

  // The Players tool moves on to a free player when the chosen one is placed.
  useEffect(() => {
    if (playerChoiceFree) return
    const next: PlayerChoice | undefined = free.players[0] ?? (free.coach ? 'P' : undefined)
    if (next) setPlayerChoice(next)
  }, [playerChoiceFree, free.players, free.coach])

  // Undo can take the Step shown away; stay on one that exists.
  useEffect(() => {
    if (stepIndex > doc.steps.length - 1) setStepIndex(doc.steps.length - 1)
  }, [stepIndex, doc.steps.length])

  // Keep a scratch Board in this browser as it changes.
  useEffect(() => {
    if (!saved) saveScratch(doc, currentStep)
  }, [saved, doc, currentStep])

  const tool: Tool = (() => {
    switch (choice) {
      case 'players':
        if (!playerChoiceFree) return { kind: 'select' }
        return playerChoice === 'P' ? { kind: 'coach' } : { kind: 'player', label: playerChoice }
      case 'ball':
        return free.ball ? { kind: 'ball' } : { kind: 'select' }
      case 'zone':
        return { kind: 'zone', shape: zoneShape, fill: zoneFill }
      default:
        return { kind: choice }
    }
  })()

  function chooseTool(next: ToolChoice) {
    setChoice(next)
    if (next !== 'select') setSelection(null)
  }

  function onPlaced(piece: Piece) {
    if (piece.kind === 'ball') setChoice('select')
  }

  // Selecting the shown Step drops any selection, which belongs to a Step.
  const goToStep = useCallback((index: number) => {
    setSelection(null)
    setStepIndex(index)
  }, [])

  // Animates from Step `from` to the next; resolves false if stopped.
  const animateStep = useCallback((from: number) => {
    return new Promise<boolean>((resolve) => {
      if (prefersReducedMotion()) {
        resolve(true)
        return
      }
      let raf = 0
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / STEP_MS)
        setFrame({ from, t: progress })
        if (progress < 1) raf = requestAnimationFrame(tick)
        else {
          cancelRef.current = null
          resolve(true)
        }
      }
      raf = requestAnimationFrame(tick)
      cancelRef.current = () => {
        cancelAnimationFrame(raf)
        cancelRef.current = null
        resolve(false)
      }
    })
  }, [])

  const animating = frame !== null || playing

  async function next() {
    if (animating || currentStep >= doc.steps.length - 1) return
    setSelection(null)
    const finished = await animateStep(currentStep)
    setFrame(null)
    if (finished) setStepIndex(currentStep + 1)
  }

  function previous() {
    if (animating || currentStep === 0) return
    goToStep(currentStep - 1)
  }

  async function play() {
    if (animating || doc.steps.length < 2) return
    setSelection(null)
    playingRef.current = true
    setPlaying(true)
    let at = currentStep
    // From the last Step, play starts again from the first.
    if (at === doc.steps.length - 1) {
      at = 0
      setStepIndex(0)
      await wait(PAUSE_MS)
    }
    while (playingRef.current && at < doc.steps.length - 1) {
      const finished = await animateStep(at)
      setFrame(null)
      if (!finished) break
      at += 1
      setStepIndex(at)
      if (at < doc.steps.length - 1) await wait(PAUSE_MS)
    }
    playingRef.current = false
    setPlaying(false)
  }

  function stop() {
    playingRef.current = false
    cancelRef.current?.()
    setFrame(null)
    setPlaying(false)
  }

  // Stop any animation when leaving the page.
  useEffect(() => () => cancelRef.current?.(), [])

  function addStep() {
    if (animating) return
    apply(insertStepAfter(doc, currentStep))
    goToStep(currentStep + 1)
  }

  function deleteStep() {
    if (animating || doc.steps.length < 2) return
    apply(removeStep(doc, currentStep))
    goToStep(Math.max(0, currentStep - 1))
  }

  function deleteSelection() {
    if (!selection) return
    apply(selection.type === 'piece' ? removePiece(doc, selection.id) : removeMark(doc, currentStep, selection.id))
    setSelection(null)
  }

  const selectedMark = selection?.type === 'mark' ? (step.marks.find((mark) => mark.id === selection.id) ?? null) : null

  function editSelectedText() {
    if (selectedMark?.kind !== 'text') return
    setTextEdit({ at: { x: selectedMark.x, y: selectedMark.y }, markId: selectedMark.id, value: selectedMark.text })
  }

  function saveText(event: FormEvent) {
    event.preventDefault()
    if (!textEdit) return
    const text = textEdit.value.trim()
    const existing = textEdit.markId && step.marks.find((mark) => mark.id === textEdit.markId)
    if (existing && existing.kind === 'text') {
      apply(text ? replaceMark(doc, currentStep, { ...existing, text }) : removeMark(doc, currentStep, existing.id))
      if (!text) setSelection(null)
    } else if (text) {
      apply(addMark(doc, currentStep, { id: newId(), kind: 'text', x: textEdit.at.x, y: textEdit.at.y, text }))
    }
    setTextEdit(null)
  }

  function startOver() {
    if (animating) return
    // Undoable, like every other change, in case it was a slip.
    apply({ ...emptyBoard(), view: doc.view, labels: doc.labels })
    goToStep(0)
  }

  // A scratch Board asks for a name, then joins the library and opens from
  // there. A saved Board keeps its changes in place.
  function save() {
    if (animating || saving) return
    if (!saved) {
      setTitleEdit({ kind: 'save', value: '' })
      return
    }
    const sent = doc
    router.patch(
      boardPath(saved.id),
      { board: { document: payload(sent) } },
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setSaving(true),
        onSuccess: () => setSavedDoc(sent),
        onFinish: () => setSaving(false),
      }
    )
  }

  function submitTitle(event: FormEvent) {
    event.preventDefault()
    if (!titleEdit || saving) return
    const options = {
      onStart: () => setSaving(true),
      onFinish: () => setSaving(false),
    }
    if (titleEdit.kind === 'save') {
      router.post(
        boardsPath,
        { board: { title: titleEdit.value, document: payload(doc) } },
        {
          ...options,
          // Kept on screen if the name is refused; once saved, it opens from
          // the library and this browser's scratch copy goes.
          preserveState: 'errors',
          onSuccess: () => clearScratch(),
        }
      )
    } else if (saved) {
      router.patch(
        boardPath(saved.id),
        { board: { title: titleEdit.value } },
        {
          ...options,
          preserveState: true,
          onSuccess: () => setTitleEdit(null),
        }
      )
    }
  }

  function close() {
    stop()
    if (saved) {
      if (unsaved && !window.confirm(t('boards.confirmDiscard'))) return
      router.visit(boardsPath)
      return
    }
    clearScratch()
    if (window.history.length > 1) window.history.back()
    else router.visit(boardsPath)
  }

  const titleError = fieldErrorText(errors, 'title', {
    blank: t('boards.titleDialog.errors.blank'),
    too_long: t('boards.titleDialog.errors.tooLong'),
  })
  const documentError = fieldErrorText(errors, 'document', {
    invalid: t('boards.saveFailed'),
    too_large: t('boards.tooLarge'),
  })

  // What the header says about where this Board is kept.
  const status = saved
    ? saving
      ? t('boards.saving')
      : unsaved
        ? t('boards.unsaved')
        : t('boards.saved')
    : t('boards.scratchNote')

  // A caption change records one undo step per visit to the field, not one
  // per letter.
  const captionTouched = useRef(false)

  // Keyboard: undo and redo, Delete for the selection, arrows between Steps.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (textEdit || titleEdit) return
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selection) {
        event.preventDefault()
        deleteSelection()
      } else if (event.key === 'Escape') {
        setSelection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shownFrame = frame
    ? { positions: positionsBetween(doc, frame.from, frame.t), marks: doc.steps[frame.from].marks }
    : null

  const hint = (() => {
    switch (choice) {
      case 'players':
        return playerChoiceFree ? t('boards.hints.players') : t('boards.hints.allPlaced')
      case 'ball':
        return free.ball ? t('boards.hints.ball') : t('boards.hints.ballPlaced')
      default:
        return t(`boards.hints.${choice}`)
    }
  })()

  return (
    <div className="fixed inset-0 flex flex-col bg-paper font-dash-sans text-ink">
      <Head title={saved ? saved.title : t('boards.title')} />

      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-2 pt-[env(safe-area-inset-top)] sm:px-3">
        <BarButton onClick={close} label={t('boards.close')}>
          <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={1.8} />
        </BarButton>
        <div className="min-w-0 flex-1 py-1.5">
          <h1 className="truncate text-base font-bold leading-tight">
            {saved ? (
              <button
                type="button"
                onClick={() => setTitleEdit({ kind: 'rename', value: saved.title })}
                aria-label={t('boards.rename', { title: saved.title })}
                className="max-w-full truncate text-left underline decoration-line-strong/40 decoration-dotted underline-offset-4 hover:decoration-ink"
              >
                {saved.title}
              </button>
            ) : (
              t('boards.title')
            )}
          </h1>
          {documentError && !titleEdit ? (
            <p role="alert" className="truncate text-xs text-danger">
              {documentError}
            </p>
          ) : (
            <p className="truncate text-xs text-muted" aria-live="polite">
              {status}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Segmented<BoardView>
            label={t('boards.view.label')}
            value={doc.view}
            options={[
              { value: 'full', label: t('boards.view.full') },
              { value: 'half', label: t('boards.view.half') },
            ]}
            onChange={(view) => apply({ ...doc, view })}
          />
          <Segmented<BoardLabels>
            label={t('boards.labels.label')}
            value={doc.labels}
            options={[
              { value: 'sectors', label: t('boards.labels.sectors') },
              { value: 'glass', label: t('boards.labels.glass') },
              { value: 'none', label: t('boards.labels.none') },
            ]}
            onChange={(labels) => apply({ ...doc, labels })}
          />
        </div>
        <BarButton onClick={undo} disabled={!canUndo || animating} label={t('boards.undo')}>
          <HugeiconsIcon icon={UndoIcon} size={20} strokeWidth={1.8} />
        </BarButton>
        <BarButton onClick={redo} disabled={!canRedo || animating} label={t('boards.redo')}>
          <HugeiconsIcon icon={RedoIcon} size={20} strokeWidth={1.8} />
        </BarButton>
        <BarButton onClick={startOver} disabled={animating} label={t('boards.startOver')}>
          <span className="hidden sm:inline">{t('boards.startOver')}</span>
          <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.8} className="sm:hidden" />
        </BarButton>
        <BarButton
          onClick={save}
          disabled={animating || saving || (saved !== null && !unsaved)}
          label={saved ? t('boards.save') : t('boards.saveNew')}
          tone="primary"
        >
          <HugeiconsIcon icon={FloppyDiskIcon} size={18} strokeWidth={1.8} />
          <span className="hidden sm:inline">{saved ? t('boards.save') : t('boards.saveNew')}</span>
        </BarButton>
      </header>

      {/* On small screens the court settings sit under the header. */}
      <div className="flex shrink-0 gap-3 overflow-x-auto border-b border-line bg-white px-3 py-1.5 md:hidden">
        <Segmented<BoardView>
          label={t('boards.view.label')}
          value={doc.view}
          options={[
            { value: 'full', label: t('boards.view.full') },
            { value: 'half', label: t('boards.view.half') },
          ]}
          onChange={(view) => apply({ ...doc, view })}
        />
        <Segmented<BoardLabels>
          label={t('boards.labels.label')}
          value={doc.labels}
          options={[
            { value: 'sectors', label: t('boards.labels.sectors') },
            { value: 'glass', label: t('boards.labels.glass') },
            { value: 'none', label: t('boards.labels.none') },
          ]}
          onChange={(labels) => apply({ ...doc, labels })}
        />
      </div>

      <main className="relative min-h-0 flex-1 p-1 sm:p-3">
        <BoardCanvas
          doc={doc}
          stepIndex={currentStep}
          frame={shownFrame}
          tool={tool}
          selection={selection}
          onSelect={setSelection}
          apply={apply}
          onPlaced={onPlaced}
          onRequestText={(at) => setTextEdit({ at, markId: null, value: '' })}
          label={t('boards.court', { step: currentStep + 1, count: doc.steps.length })}
        />
      </main>

      {/* What the chosen tool does, and its options. */}
      <div className="flex min-h-14 shrink-0 items-center gap-2 overflow-x-auto border-t border-line bg-white px-3 py-1.5">
        {choice === 'players' && (
          <fieldset className="flex shrink-0 gap-1.5">
            <legend className="sr-only">{t('boards.tools.players')}</legend>
            {(['A', 'B', 'C', 'D', 'P'] as PlayerChoice[]).map((label) => {
              const isFree = label === 'P' ? free.coach : free.players.includes(label)
              const piece: Piece = label === 'P' ? { id: label, kind: 'coach' } : { id: label, kind: 'player', label }
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!isFree}
                  aria-pressed={isFree && playerChoice === label}
                  aria-label={label === 'P' ? t('boards.coach') : t('boards.player', { label })}
                  onClick={() => setPlayerChoice(label)}
                  className={
                    'flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-30 ' +
                    (isFree && playerChoice === label ? 'ring-2 ring-teal-deep ring-offset-2' : '')
                  }
                >
                  <svg viewBox="-0.6 -0.6 1.2 1.2" className="h-9 w-9" aria-hidden="true">
                    <PieceShape piece={piece} />
                  </svg>
                </button>
              )
            })}
          </fieldset>
        )}
        {choice === 'zone' && (
          <>
            <Segmented<'rect' | 'circle'>
              label={t('boards.tools.zone')}
              value={zoneShape}
              options={[
                { value: 'rect', label: t('boards.zone.rect') },
                { value: 'circle', label: t('boards.zone.circle') },
              ]}
              onChange={setZoneShape}
            />
            <Segmented<ZoneFill>
              label={t('boards.tools.zone')}
              value={zoneFill}
              options={[
                { value: 'striped', label: t('boards.zone.striped') },
                { value: 'outline', label: t('boards.zone.outline') },
              ]}
              onChange={setZoneFill}
            />
          </>
        )}
        {choice === 'select' && selection ? (
          <>
            {selectedMark?.kind === 'text' && (
              <BarButton onClick={editSelectedText} label={t('boards.selection.editText')}>
                {t('boards.selection.editText')}
              </BarButton>
            )}
            <BarButton onClick={deleteSelection} label={t('boards.selection.delete')} tone="danger">
              <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
              {t('boards.selection.delete')}
            </BarButton>
          </>
        ) : (
          <p className="min-w-48 flex-1 text-meta text-muted">{hint}</p>
        )}
        {choice === 'ink' && hasInk(step) && (
          <BarButton onClick={() => apply(clearInk(doc, currentStep))} label={t('boards.clearInk')} tone="danger">
            {t('boards.clearInk')}
          </BarButton>
        )}
      </div>

      <nav
        aria-label={t('boards.tools.label')}
        className="flex shrink-0 gap-1 overflow-x-auto border-t border-line bg-white px-2 py-1.5"
      >
        {TOOL_CHOICES.map((kind) => (
          <ToolButton
            key={kind}
            active={choice === kind}
            onClick={() => chooseTool(kind)}
            label={t(`boards.tools.${kind}`)}
          >
            <ToolGlyph kind={kind} />
          </ToolButton>
        ))}
      </nav>

      <footer className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-line bg-white px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:flex-nowrap sm:px-3">
        <div className="flex items-center gap-1">
          <BarButton onClick={previous} disabled={animating || currentStep === 0} label={t('boards.steps.previous')}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} />
          </BarButton>
          <span className="min-w-24 text-center font-dash-mono text-meta font-semibold tabular-nums" aria-live="polite">
            {t('boards.steps.position', { step: currentStep + 1, count: doc.steps.length })}
          </span>
          <BarButton
            onClick={next}
            disabled={animating || currentStep >= doc.steps.length - 1}
            label={t('boards.steps.next')}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={1.8} />
          </BarButton>
          {playing ? (
            <BarButton onClick={stop} label={t('boards.steps.pause')} tone="primary">
              <HugeiconsIcon icon={PauseIcon} size={18} strokeWidth={1.8} />
              <span className="hidden sm:inline">{t('boards.steps.pause')}</span>
            </BarButton>
          ) : (
            <BarButton
              onClick={play}
              disabled={animating || doc.steps.length < 2}
              label={t('boards.steps.play')}
              tone="primary"
            >
              <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={1.8} />
              <span className="hidden sm:inline">{t('boards.steps.play')}</span>
            </BarButton>
          )}
        </div>
        <input
          type="text"
          value={step.caption}
          maxLength={140}
          disabled={animating}
          aria-label={t('boards.steps.caption', { step: currentStep + 1 })}
          placeholder={t('boards.steps.captionPlaceholder')}
          onFocus={() => {
            captionTouched.current = false
          }}
          onChange={(event) => {
            apply(setCaption(doc, currentStep, event.target.value), !captionTouched.current)
            captionTouched.current = true
          }}
          className="order-last min-h-11 w-full min-w-0 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-muted focus:border-teal-deep focus:outline-none sm:order-none sm:flex-1"
        />
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <BarButton onClick={addStep} disabled={animating} label={t('boards.steps.add')}>
            <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.8} />
            <span className="hidden lg:inline">{t('boards.steps.add')}</span>
          </BarButton>
          <BarButton
            onClick={deleteStep}
            disabled={animating || doc.steps.length < 2}
            label={t('boards.steps.remove')}
            tone="danger"
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
            <span className="hidden lg:inline">{t('boards.steps.remove')}</span>
          </BarButton>
        </div>
      </footer>

      {textEdit && (
        <FormDialog
          title={t('boards.textDialog.title')}
          label={t('boards.textDialog.label')}
          value={textEdit.value}
          maxLength={40}
          onChange={(value) => setTextEdit({ ...textEdit, value })}
          onCancel={() => setTextEdit(null)}
          onSubmit={saveText}
          submitLabel={t('boards.textDialog.save')}
          cancelLabel={t('boards.textDialog.cancel')}
        />
      )}

      {titleEdit && (
        <FormDialog
          title={titleEdit.kind === 'save' ? t('boards.titleDialog.saveTitle') : t('boards.titleDialog.renameTitle')}
          label={t('boards.titleDialog.label')}
          placeholder={t('boards.titleDialog.placeholder')}
          value={titleEdit.value}
          maxLength={80}
          onChange={(value) => setTitleEdit({ ...titleEdit, value })}
          onCancel={() => setTitleEdit(null)}
          onSubmit={submitTitle}
          submitLabel={titleEdit.kind === 'save' ? t('boards.titleDialog.save') : t('boards.titleDialog.rename')}
          cancelLabel={t('boards.titleDialog.cancel')}
          busy={saving}
          error={titleError ?? (titleEdit.kind === 'save' ? documentError : null)}
        >
          {titleEdit.kind === 'save' && <p className="mt-2 text-meta text-muted">{t('boards.titleDialog.private')}</p>}
        </FormDialog>
      )}
    </div>
  )
}

// A small dialog asking for one line of text: a text mark's words, or a
// Board's name.
function FormDialog({
  title,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
  cancelLabel,
  busy = false,
  error = null,
  children,
}: {
  title: string
  label: string
  value: string
  placeholder?: string
  maxLength: number
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  cancelLabel: string
  busy?: boolean
  error?: string | null
  children?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-float"
        aria-labelledby="board-dialog-title"
      >
        <h2 id="board-dialog-title" className="text-base font-bold">
          {title}
        </h2>
        <label className="mt-3 block text-meta font-semibold text-muted-strong" htmlFor="board-dialog-input">
          {label}
        </label>
        <input
          id="board-dialog-input"
          // biome-ignore lint/a11y/noAutofocus: the dialog exists to type this text.
          autoFocus
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'board-dialog-error' : undefined}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel()
          }}
          className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base placeholder:text-muted focus:border-teal-deep focus:outline-none"
        />
        {error && (
          <p id="board-dialog-error" role="alert" className="mt-1.5 text-meta text-danger">
            {error}
          </p>
        )}
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <BarButton onClick={onCancel} label={cancelLabel}>
            {cancelLabel}
          </BarButton>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-lg bg-ink px-4 text-meta font-semibold text-paper hover:bg-ink-soft disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
