// A Board (Quadro): a full-screen padel court a Coach explains on, held up
// to a group on a tablet or phone (docs/specs/Boards.md, ADR 0010). It opens
// in one of three ways:
//
// - scratch: a new Board, or a copy of an Exercise's Board to adapt. Nothing
//   reaches the server and it is kept in this browser until the Coach closes
//   it, unless they save it into their library.
// - library: a Board the Coach saved, opened as it was saved; changes stay
//   on screen until saved again.
// - exercise: an Exercise's official Board, which only Admins edit, with its
//   words in Portuguese and English.

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
  RotateLeft01Icon,
  RotateRight01Icon,
  UndoIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { Head, router, usePage } from '@inertiajs/react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { boardPath, boardsPath, exerciseBoardPath, exercisePath } from '@/lib/paths'
import { fieldErrorText } from '../components/ui'
import { BoardCanvas, type Selection, type Tool } from './Canvas'
import { BoardLocaleContext } from './Court'
import type { BoardDocument, Locale, LocalizedText, Piece, PlayerLabel, ZoneFill } from './document'
import {
  addMark,
  clearInk,
  emptyBoard,
  hasInk,
  inLocale,
  insertStepAfter,
  isBlank,
  localizedExactly,
  newId,
  parseBoard,
  placeable,
  removeMark,
  removePiece,
  removeStep,
  replaceMark,
  setCaption,
  TEXT_TURN_STEP,
  turnText,
  withLocalized,
} from './document'
import type { BoardLabels, BoardView, Point } from './geometry'
import { PieceShape } from './glyphs'
import { useBoardHistory } from './history'
import { clearScratch, loadScratch, saveScratch } from './storage'
import { BarButton, Segmented, ToolButton, ToolGlyph } from './Toolbar'
import { useStepPlayer } from './useStepPlayer'

type ToolChoice = 'select' | 'players' | 'ball' | 'cone' | 'ballPath' | 'arrow' | 'zone' | 'text' | 'ink'
const TOOL_CHOICES: ToolChoice[] = ['select', 'players', 'ball', 'cone', 'ballPath', 'arrow', 'zone', 'text', 'ink']

// Which of A–D or the Coach the Players tool places.
type PlayerChoice = PlayerLabel | 'P'

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

// An Exercise's official Board, copied for a Coach to explain on.
export interface ExerciseCopy {
  ref: string
  title: string
  document: unknown
}

// The Exercise whose official Board an Admin is editing.
export interface BoardExercise {
  ref: string
  title: string
  // The Exercise in the admin, which editing returns to.
  adminPath: string
}

export type BoardMode =
  | { kind: 'scratch'; from: ExerciseCopy | null }
  | { kind: 'library'; board: SavedBoard }
  | { kind: 'exercise'; exercise: BoardExercise; document: unknown | null }

// The name asked for when saving a Board, or when renaming a saved one.
interface TitleEdit {
  kind: 'save' | 'rename'
  value: string
}

// The document a Board opens with, read once: later props only tell what was
// saved since.
function openedDocument(mode: BoardMode, locale: Locale): { doc: BoardDocument; stepIndex: number } | null {
  switch (mode.kind) {
    case 'scratch': {
      const kept = loadScratch()
      if (!mode.from) return kept
      // A copy of the Exercise's Board, unless this browser already keeps one
      // being adapted, in the Coach's language.
      if (kept && kept.source === mode.from.ref) return kept
      const official = parseBoard(mode.from.document)
      return official ? { doc: inLocale(official, locale), stepIndex: 0 } : null
    }
    case 'library': {
      const doc = parseBoard(mode.board.document)
      return doc ? { doc, stepIndex: 0 } : null
    }
    case 'exercise': {
      const doc = mode.document === null ? null : parseBoard(mode.document)
      return doc ? { doc, stepIndex: 0 } : null
    }
  }
}

export function BoardScreen({ mode }: { mode: BoardMode }) {
  const { t, locale } = useTranslation()
  const errors = (usePage().props.errors ?? {}) as Record<string, unknown>
  const library = mode.kind === 'library' ? mode.board : null
  const exercise = mode.kind === 'exercise' ? mode.exercise : null
  const from = mode.kind === 'scratch' ? mode.from : null

  const [opened] = useState(() => openedDocument(mode, locale))
  const { doc, apply, undo, redo, canUndo, canRedo } = useBoardHistory(() => opened?.doc ?? emptyBoard())

  // The document as last saved, for a Board that is kept on the server. Undo
  // hands back the very documents it kept, so undoing to the saved Board
  // counts as no change. An Exercise without a Board yet has none.
  const [savedDoc, setSavedDoc] = useState(() =>
    mode.kind === 'library' || (mode.kind === 'exercise' && opened) ? doc : null
  )
  const kept = mode.kind !== 'scratch'
  const unsaved = kept && doc !== savedDoc
  const [saving, setSaving] = useState(false)
  const [titleEdit, setTitleEdit] = useState<TitleEdit | null>(null)

  // An Exercise's Board is written in both languages, one at a time.
  const [editLocale, setEditLocale] = useState<Locale>(locale)
  const textLocale: Locale = exercise ? editLocale : locale
  // Words as the Board keeps them: in both languages on an Exercise's Board.
  const wordsFor = (existing: LocalizedText, value: string): LocalizedText =>
    exercise ? withLocalized(existing, editLocale, value) : value

  const [choice, setChoice] = useState<ToolChoice>('select')
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice>('A')
  const [zoneShape, setZoneShape] = useState<'rect' | 'circle'>('rect')
  const [zoneFill, setZoneFill] = useState<ZoneFill>('striped')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [textEdit, setTextEdit] = useState<TextEdit | null>(null)

  // Moving between Steps drops the selection, which belongs to a Step.
  const player = useStepPlayer(doc, opened?.stepIndex ?? 0, () => setSelection(null))
  const { stepIndex: currentStep, frame, animating, playing, goTo: goToStep, next, previous, play, stop } = player
  const step = doc.steps[currentStep]

  const free = placeable(doc)
  const playerChoiceFree = playerChoice === 'P' ? free.coach : free.players.includes(playerChoice)

  // The Players tool moves on to a free player when the chosen one is placed.
  useEffect(() => {
    if (playerChoiceFree) return
    const next: PlayerChoice | undefined = free.players[0] ?? (free.coach ? 'P' : undefined)
    if (next) setPlayerChoice(next)
  }, [playerChoiceFree, free.players, free.coach])

  // Keep a scratch Board in this browser as it changes, with the Exercise it
  // was copied from.
  const fromRef = from?.ref ?? null
  useEffect(() => {
    if (!kept) saveScratch(doc, currentStep, fromRef)
  }, [kept, doc, currentStep, fromRef])

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
    setTextEdit({
      at: { x: selectedMark.x, y: selectedMark.y },
      markId: selectedMark.id,
      value: localizedExactly(selectedMark.text, textLocale),
    })
  }

  // Text left empty in every language is removed.
  function saveText(event: FormEvent) {
    event.preventDefault()
    if (!textEdit) return
    const value = textEdit.value.trim()
    const existing = textEdit.markId && step.marks.find((mark) => mark.id === textEdit.markId)
    if (existing && existing.kind === 'text') {
      const text = wordsFor(existing.text, value)
      apply(
        isBlank(text) ? removeMark(doc, currentStep, existing.id) : replaceMark(doc, currentStep, { ...existing, text })
      )
      if (isBlank(text)) setSelection(null)
    } else if (value) {
      const text = wordsFor('', value)
      const id = newId()
      apply(addMark(doc, currentStep, { id, kind: 'text', x: textEdit.at.x, y: textEdit.at.y, text }))
      // Selected straight away, so it can be turned or given a marker line.
      setChoice('select')
      setSelection({ type: 'mark', id })
    }
    setTextEdit(null)
  }

  // Turning the selected text, or giving it a marker line, or taking it away.
  function changeSelectedText(change: { rotate?: number; marker?: boolean }) {
    if (selectedMark?.kind !== 'text') return
    apply(replaceMark(doc, currentStep, { ...selectedMark, ...change }))
  }

  function startOver() {
    if (animating) return
    // Undoable, like every other change, in case it was a slip.
    apply({ ...emptyBoard(), view: doc.view, labels: doc.labels })
    goToStep(0)
  }

  // Saving a document that the server keeps, then marking it as saved.
  function saveDocument(path: string, method: 'patch' | 'put') {
    const sent = doc
    router[method](
      path,
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

  // A scratch Board asks for a name, then joins the library and opens from
  // there. A saved Board, or an Exercise's, keeps its changes in place.
  function save() {
    if (animating || saving) return
    if (library) saveDocument(boardPath(library.id), 'patch')
    else if (exercise) saveDocument(exerciseBoardPath(exercise.ref), 'put')
    else setTitleEdit({ kind: 'save', value: from?.title ?? '' })
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
    } else if (library) {
      router.patch(
        boardPath(library.id),
        { board: { title: titleEdit.value } },
        {
          ...options,
          preserveState: true,
          onSuccess: () => setTitleEdit(null),
        }
      )
    }
  }

  // Taking an Exercise's official Board away; its PNG diagram shows again.
  function removeExerciseBoard() {
    if (!exercise || !window.confirm(t('boards.exercise.confirmRemove', { title: exercise.title }))) return
    router.delete(exerciseBoardPath(exercise.ref))
  }

  function close() {
    stop()
    if (unsaved && !window.confirm(t('boards.confirmDiscard'))) return
    if (library) {
      router.visit(boardsPath)
    } else if (exercise) {
      // The admin is not part of this app's pages.
      window.location.assign(exercise.adminPath)
    } else {
      clearScratch()
      if (window.history.length > 1) window.history.back()
      else router.visit(from ? exercisePath(from.ref) : boardsPath)
    }
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
  const status = kept
    ? saving
      ? t('boards.saving')
      : unsaved
        ? t('boards.unsaved')
        : exercise
          ? t('boards.exercise.saved')
          : t('boards.saved')
    : from
      ? t('boards.copyNote', { title: from.title })
      : t('boards.scratchNote')

  const heading = library?.title ?? exercise?.title ?? t('boards.title')

  // A caption change records one undo step per visit to the field, not one
  // per letter.
  const captionTouched = useRef(false)

  // Keyboard: undo and redo, Delete for the selection.
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
      <Head title={heading} />

      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-2 pt-[env(safe-area-inset-top)] sm:px-3">
        <BarButton onClick={close} label={t('boards.close')}>
          <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={1.8} />
        </BarButton>
        <div className="min-w-0 flex-1 py-1.5">
          <h1 className="truncate text-base font-bold leading-tight">
            {library ? (
              <button
                type="button"
                onClick={() => setTitleEdit({ kind: 'rename', value: library.title })}
                aria-label={t('boards.rename', { title: library.title })}
                className="max-w-full truncate text-left underline decoration-line-strong/40 decoration-dotted underline-offset-4 hover:decoration-ink"
              >
                {library.title}
              </button>
            ) : (
              heading
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
        {exercise && (
          <Segmented<Locale>
            label={t('boards.exercise.language')}
            value={editLocale}
            options={[
              { value: 'pt', label: 'PT' },
              { value: 'en', label: 'EN' },
            ]}
            onChange={setEditLocale}
          />
        )}
        <div className={`hidden items-center gap-3 ${exercise ? 'xl:flex' : 'md:flex'}`}>
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
        {exercise && savedDoc && (
          <BarButton
            onClick={removeExerciseBoard}
            disabled={animating || saving}
            label={t('boards.exercise.remove')}
            tone="danger"
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} />
            <span className="hidden 2xl:inline">{t('boards.exercise.remove')}</span>
          </BarButton>
        )}
        <BarButton
          onClick={save}
          disabled={animating || saving || (kept && !unsaved)}
          label={t('boards.save')}
          tone="primary"
        >
          <HugeiconsIcon icon={FloppyDiskIcon} size={18} strokeWidth={1.8} />
          <span className="hidden sm:inline">{t('boards.save')}</span>
        </BarButton>
      </header>

      {/* On small screens, and with an Exercise's language choice, the court
          settings sit under the header. */}
      <div
        className={`flex shrink-0 gap-3 overflow-x-auto border-b border-line bg-white px-3 py-1.5 ${exercise ? 'xl:hidden' : 'md:hidden'}`}
      >
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
        <BoardLocaleContext.Provider value={textLocale}>
          <BoardCanvas
            doc={doc}
            stepIndex={currentStep}
            frame={frame}
            tool={tool}
            selection={selection}
            onSelect={setSelection}
            apply={apply}
            onPlaced={onPlaced}
            onRequestText={(at) => setTextEdit({ at, markId: null, value: '' })}
            label={t('boards.court', { step: currentStep + 1, count: doc.steps.length })}
          />
        </BoardLocaleContext.Provider>
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
              <>
                <BarButton onClick={editSelectedText} label={t('boards.selection.editText')}>
                  {t('boards.selection.editText')}
                </BarButton>
                <fieldset className="flex shrink-0 items-center">
                  <legend className="sr-only">{t('boards.selection.turn')}</legend>
                  <BarButton
                    onClick={() => changeSelectedText({ rotate: turnText(selectedMark.rotate, -TEXT_TURN_STEP) })}
                    label={t('boards.selection.turnLeft')}
                  >
                    <HugeiconsIcon icon={RotateLeft01Icon} size={18} strokeWidth={1.8} />
                  </BarButton>
                  <span
                    className="min-w-10 text-center font-dash-mono text-meta font-semibold tabular-nums"
                    aria-live="polite"
                  >
                    {t('boards.selection.angle', { degrees: selectedMark.rotate ?? 0 })}
                  </span>
                  <BarButton
                    onClick={() => changeSelectedText({ rotate: turnText(selectedMark.rotate, TEXT_TURN_STEP) })}
                    label={t('boards.selection.turnRight')}
                  >
                    <HugeiconsIcon icon={RotateRight01Icon} size={18} strokeWidth={1.8} />
                  </BarButton>
                </fieldset>
                <button
                  type="button"
                  aria-pressed={selectedMark.marker === true}
                  onClick={() => changeSelectedText({ marker: !selectedMark.marker })}
                  className={
                    'min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-meta font-semibold transition-colors ' +
                    (selectedMark.marker
                      ? 'bg-tint-teal text-teal-ink ring-2 ring-teal-deep'
                      : 'text-ink hover:bg-mist')
                  }
                >
                  {t('boards.selection.marker')}
                </button>
              </>
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
          value={localizedExactly(step.caption, textLocale)}
          maxLength={140}
          disabled={animating}
          aria-label={t('boards.steps.caption', { step: currentStep + 1 })}
          placeholder={t('boards.steps.captionPlaceholder')}
          onFocus={() => {
            captionTouched.current = false
          }}
          onChange={(event) => {
            apply(setCaption(doc, currentStep, wordsFor(step.caption, event.target.value)), !captionTouched.current)
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
          title={
            exercise
              ? t('boards.exercise.textTitle', { language: editLocale.toUpperCase() })
              : t('boards.textDialog.title')
          }
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
