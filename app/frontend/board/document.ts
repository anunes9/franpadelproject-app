// A Board's document and the edits made to it. Every edit is a pure function
// from one document to the next, so undo is keeping the documents before it.
//
// Pieces (players, the Coach, the ball, cones) are declared once and stand
// somewhere in every Step, which is what lets the Board animate them from one
// Step to the next. Markings belong to one Step.

import type { BoardLabels, BoardView, GlassPanel, Point } from './geometry'
import { clampToCourt, roundPoint } from './geometry'

export type PlayerLabel = 'A' | 'B' | 'C' | 'D'
export const PLAYER_LABELS: PlayerLabel[] = ['A', 'B', 'C', 'D']

// A and B are one pair, C and D the other.
export const pairOf = (label: PlayerLabel): 'ab' | 'cd' => (label === 'A' || label === 'B' ? 'ab' : 'cd')

export type Piece =
  | { id: string; kind: 'player'; label: PlayerLabel }
  | { id: string; kind: 'coach' }
  | { id: string; kind: 'ball' }
  | { id: string; kind: 'cone' }

export type PieceKind = Piece['kind']

// A point of a ball path. Between the first and the last, a point on a glass
// panel is a bounce off that panel, and any other is a bounce on the floor.
export interface PathPoint extends Point {
  glass?: GlassPanel
}

export type ZoneFill = 'striped' | 'outline'

export type Mark =
  | { id: string; kind: 'ballPath'; points: PathPoint[] }
  | { id: string; kind: 'arrow'; from: Point; to: Point }
  | { id: string; kind: 'zone'; shape: 'rect'; fill: ZoneFill; x: number; y: number; w: number; h: number }
  | { id: string; kind: 'zone'; shape: 'circle'; fill: ZoneFill; cx: number; cy: number; r: number }
  | { id: string; kind: 'text'; x: number; y: number; text: string }
  | { id: string; kind: 'ink'; points: [number, number][] }

export type MarkKind = Mark['kind']

export interface Step {
  caption: string
  positions: Record<string, Point>
  marks: Mark[]
}

export interface BoardDocument {
  version: 1
  view: BoardView
  labels: BoardLabels
  pieces: Piece[]
  steps: Step[]
}

export const newId = () => Math.random().toString(36).slice(2, 10)

const emptyStep = (): Step => ({ caption: '', positions: {}, marks: [] })

export const emptyBoard = (): BoardDocument => ({
  version: 1,
  view: 'full',
  labels: 'sectors',
  pieces: [],
  steps: [emptyStep()],
})

const withStep = (doc: BoardDocument, index: number, change: (step: Step) => Step): BoardDocument => ({
  ...doc,
  steps: doc.steps.map((step, i) => (i === index ? change(step) : step)),
})

// The player letters, Coach and ball still free to place: each is on a Board
// at most once. Cones are unlimited.
export function placeable(doc: BoardDocument) {
  const labels = new Set(doc.pieces.flatMap((piece) => (piece.kind === 'player' ? [piece.label] : [])))
  return {
    players: PLAYER_LABELS.filter((label) => !labels.has(label)),
    coach: !doc.pieces.some((piece) => piece.kind === 'coach'),
    ball: !doc.pieces.some((piece) => piece.kind === 'ball'),
  }
}

// A new piece stands at the same place in every Step, so it is there whichever
// Step it was placed in.
export function addPiece(doc: BoardDocument, piece: Piece, at: Point): BoardDocument {
  const position = roundPoint(clampToCourt(at))
  return {
    ...doc,
    pieces: [...doc.pieces, piece],
    steps: doc.steps.map((step) => ({ ...step, positions: { ...step.positions, [piece.id]: position } })),
  }
}

// Moving a piece moves it in one Step only.
export const movePiece = (doc: BoardDocument, stepIndex: number, id: string, to: Point): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({
    ...step,
    positions: { ...step.positions, [id]: roundPoint(clampToCourt(to)) },
  }))

// Removing a piece removes it from every Step.
export function removePiece(doc: BoardDocument, id: string): BoardDocument {
  return {
    ...doc,
    pieces: doc.pieces.filter((piece) => piece.id !== id),
    steps: doc.steps.map((step) => {
      const { [id]: _removed, ...positions } = step.positions
      return { ...step, positions }
    }),
  }
}

export const addMark = (doc: BoardDocument, stepIndex: number, mark: Mark): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({ ...step, marks: [...step.marks, mark] }))

export const replaceMark = (doc: BoardDocument, stepIndex: number, mark: Mark): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({
    ...step,
    marks: step.marks.map((existing) => (existing.id === mark.id ? mark : existing)),
  }))

export const removeMark = (doc: BoardDocument, stepIndex: number, id: string): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({ ...step, marks: step.marks.filter((mark) => mark.id !== id) }))

export const clearInk = (doc: BoardDocument, stepIndex: number): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({ ...step, marks: step.marks.filter((mark) => mark.kind !== 'ink') }))

export const hasInk = (step: Step) => step.marks.some((mark) => mark.kind === 'ink')

export const setCaption = (doc: BoardDocument, stepIndex: number, caption: string): BoardDocument =>
  withStep(doc, stepIndex, (step) => ({ ...step, caption }))

// A new Step starts where the Step before it ends: every piece where it
// stands, with no markings, so the Coach moves on from there.
export function insertStepAfter(doc: BoardDocument, stepIndex: number): BoardDocument {
  const steps = [...doc.steps]
  steps.splice(stepIndex + 1, 0, { ...emptyStep(), positions: { ...doc.steps[stepIndex].positions } })
  return { ...doc, steps }
}

// A Board always keeps at least one Step.
export function removeStep(doc: BoardDocument, stepIndex: number): BoardDocument {
  if (doc.steps.length <= 1) return doc
  return { ...doc, steps: doc.steps.filter((_, i) => i !== stepIndex) }
}

// A mark moved by an offset, as when it is dragged.
export function translateMark(mark: Mark, dx: number, dy: number): Mark {
  const shift = (p: Point) => roundPoint({ x: p.x + dx, y: p.y + dy })
  switch (mark.kind) {
    case 'ballPath':
      // A moved path no longer touches the glass it bounced off.
      return { ...mark, points: mark.points.map(({ glass: _glass, ...p }) => shift(p)) }
    case 'arrow':
      return { ...mark, from: shift(mark.from), to: shift(mark.to) }
    case 'zone':
      if (mark.shape === 'rect') {
        const at = shift({ x: mark.x, y: mark.y })
        return { ...mark, x: at.x, y: at.y }
      } else {
        const at = shift({ x: mark.cx, y: mark.cy })
        return { ...mark, cx: at.x, cy: at.y }
      }
    case 'text': {
      const at = shift({ x: mark.x, y: mark.y })
      return { ...mark, x: at.x, y: at.y }
    }
    case 'ink':
      return {
        ...mark,
        points: mark.points.map(([x, y]) => [x + dx, y + dy].map((v) => Math.round(v * 100) / 100) as [number, number]),
      }
  }
}

// A scratch Board read back from the browser, if it is still one this
// version of the app can open.
export function parseBoard(value: unknown): BoardDocument | null {
  if (typeof value !== 'object' || value === null) return null
  const doc = value as Partial<BoardDocument>
  if (doc.version !== 1 || !Array.isArray(doc.pieces) || !Array.isArray(doc.steps) || doc.steps.length === 0)
    return null
  if (doc.view !== 'full' && doc.view !== 'half') return null
  if (doc.labels !== 'sectors' && doc.labels !== 'glass' && doc.labels !== 'none') return null
  const stepsOk = doc.steps.every(
    (step) =>
      typeof step === 'object' &&
      step !== null &&
      typeof step.caption === 'string' &&
      typeof step.positions === 'object' &&
      step.positions !== null &&
      Array.isArray(step.marks)
  )
  return stepsOk ? (doc as BoardDocument) : null
}
