// The court a Coach draws on. One pointer at a time (touch, mouse or pen):
// with the Move tool it drags pieces and markings; with a piece tool a tap
// places the piece (and a drag carries it on); with a drawing tool a drag
// draws the marking, which joins the Board, as one undo step, when the
// pointer lifts.

import { type PointerEvent as ReactPointerEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import { BoardDefIdsContext, BoardDefs, Court, UprightContext } from './Court'
import type { BoardDocument, Mark, PathPoint, Piece, PlayerLabel, ZoneFill } from './document'
import { addMark, addPiece, movePiece, newId, replaceMark, translateMark } from './document'
import type { Point } from './geometry'
import { clampToView, distance, last, roundPoint, snapToGlass, viewBox } from './geometry'
import { MarkHitArea, MarkShape, PieceShape, pieceRadius } from './glyphs'

export type Tool =
  | { kind: 'select' }
  | { kind: 'player'; label: PlayerLabel }
  | { kind: 'coach' }
  | { kind: 'ball' }
  | { kind: 'cone' }
  | { kind: 'ballPath' }
  | { kind: 'arrow' }
  | { kind: 'zone'; shape: 'rect' | 'circle'; fill: ZoneFill }
  | { kind: 'text' }
  | { kind: 'ink' }

export type Selection = { type: 'piece' | 'mark'; id: string }

// Tools under which pieces can be picked up and dragged.
const PIECE_TOOLS = new Set<Tool['kind']>(['select', 'player', 'coach', 'ball', 'cone'])

// A marking drawn shorter than this is taken as a slip and dropped.
const MIN_LENGTH = 0.3
// How close to the end of a ball path a drag must start to carry it on.
const EXTEND_REACH = 0.6
// How close to a piece a ball path or a run starts at it.
const PIECE_REACH = 0.7

type Draft =
  | { kind: 'ballPath'; points: PathPoint[]; current: PathPoint; extending: string | null }
  | { kind: 'arrow'; from: Point; to: Point }
  | { kind: 'zone'; shape: 'rect' | 'circle'; fill: ZoneFill; from: Point; to: Point }
  | { kind: 'ink'; points: Point[] }

type Gesture =
  | { type: 'piece'; pointerId: number; id: string; offset: Point; moved: boolean }
  | { type: 'mark'; pointerId: number; id: string; last: Point; moved: boolean }
  | { type: 'draft'; pointerId: number }

interface Props {
  doc: BoardDocument
  stepIndex: number
  // While the Board animates between Steps: where the pieces are, and the
  // markings shown. Nothing can be touched meanwhile.
  frame: { positions: Record<string, Point>; marks: Mark[] } | null
  tool: Tool
  selection: Selection | null
  onSelect: (selection: Selection | null) => void
  apply: (doc: BoardDocument, record?: boolean) => void
  // After a piece is placed, so the page can move on to the next free one.
  onPlaced: (piece: Piece) => void
  // A tap with the Text tool, asking for the words to put there.
  onRequestText: (at: Point) => void
  label: string
}

function draftMark(draft: Draft): Mark | null {
  switch (draft.kind) {
    case 'ballPath':
      return { id: 'draft', kind: 'ballPath', points: [...draft.points, draft.current] }
    case 'arrow':
      return { id: 'draft', kind: 'arrow', from: draft.from, to: draft.to }
    case 'zone':
      return zoneFrom(draft, 'draft')
    case 'ink':
      return { id: 'draft', kind: 'ink', points: draft.points.map((p) => [p.x, p.y]) }
  }
}

// A rectangle is dragged corner to corner; a circle from its centre out.
function zoneFrom(draft: Extract<Draft, { kind: 'zone' }>, id: string): Mark {
  if (draft.shape === 'circle') {
    return {
      id,
      kind: 'zone',
      shape: 'circle',
      fill: draft.fill,
      cx: draft.from.x,
      cy: draft.from.y,
      r: distance(draft.from, draft.to),
    }
  }
  return {
    id,
    kind: 'zone',
    shape: 'rect',
    fill: draft.fill,
    x: Math.min(draft.from.x, draft.to.x),
    y: Math.min(draft.from.y, draft.to.y),
    w: Math.abs(draft.to.x - draft.from.x),
    h: Math.abs(draft.to.y - draft.from.y),
  }
}

const round2 = (value: number) => Math.round(value * 100) / 100

// The drawn marking as it joins the Board, or null when it was too small to
// be meant.
function finishedMark(draft: Draft): Mark | null {
  const id = newId()
  switch (draft.kind) {
    case 'arrow':
      return distance(draft.from, draft.to) < MIN_LENGTH
        ? null
        : { id, kind: 'arrow', from: roundPoint(draft.from), to: roundPoint(draft.to) }
    case 'zone': {
      const zone = zoneFrom(draft, id)
      if (zone.kind !== 'zone') return null
      if (zone.shape === 'circle') return zone.r < MIN_LENGTH / 2 ? null : { ...zone, r: round2(zone.r) }
      return zone.w < MIN_LENGTH || zone.h < MIN_LENGTH
        ? null
        : { ...zone, x: round2(zone.x), y: round2(zone.y), w: round2(zone.w), h: round2(zone.h) }
    }
    case 'ink':
      return draft.points.length < 2
        ? null
        : { id, kind: 'ink', points: draft.points.map((p) => [round2(p.x), round2(p.y)]) }
    case 'ballPath':
      // Finished by the pointer-up handler, which may carry an existing path on.
      return null
  }
}

const withRoundedPoint = (p: PathPoint): PathPoint => ({ ...p, ...roundPoint(p) })

export function BoardCanvas({
  doc,
  stepIndex,
  frame,
  tool,
  selection,
  onSelect,
  apply,
  onPlaced,
  onRequestText,
  label,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const courtRef = useRef<SVGGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  // The marking being drawn, kept in a ref too so that lifting the pointer
  // reads its latest point even before React has re-rendered.
  const [draft, setDraftState] = useState<Draft | null>(null)
  const draftRef = useRef<Draft | null>(null)
  function setDraft(next: Draft | null | ((previous: Draft | null) => Draft | null)) {
    draftRef.current = typeof next === 'function' ? next(draftRef.current) : next
    setDraftState(draftRef.current)
  }
  // The latest document, for pointer handlers that run between renders.
  const docRef = useRef(doc)
  docRef.current = doc

  const reactId = useId()
  const defIds = useMemo(() => ({ stripes: `${reactId}-stripes`, arrowhead: `${reactId}-arrowhead` }), [reactId])

  // The court turns 90° to fill a portrait screen.
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setPortrait(height > width * 1.05)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const step = doc.steps[stepIndex]
  const positions = frame?.positions ?? step.positions
  const marks = frame?.marks ?? step.marks
  const interactive = frame === null

  const box = viewBox(doc.view)
  // Turned by rotate(90), (x, y) is drawn at (-y, x).
  const svgViewBox = portrait
    ? `${-(box.y + box.height)} ${box.x} ${box.height} ${box.width}`
    : `${box.x} ${box.y} ${box.width} ${box.height}`

  // A pointer's place on the court, in metres, whichever way it is turned.
  function toCourt(event: { clientX: number; clientY: number }): Point {
    const matrix = courtRef.current?.getScreenCTM()
    if (!matrix) return { x: 0, y: 0 }
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    return { x: p.x, y: p.y }
  }

  function capture(event: ReactPointerEvent) {
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  // The piece nearest a point within reach, for starting a run or a ball path
  // at it.
  function pieceNear(p: Point, kinds: Piece['kind'][]): Point | null {
    let best: { at: Point; gap: number } | null = null
    for (const piece of docRef.current.pieces) {
      if (!kinds.includes(piece.kind)) continue
      const at = docRef.current.steps[stepIndex].positions[piece.id]
      if (!at) continue
      const gap = distance(at, p)
      if (gap <= PIECE_REACH && (!best || gap < best.gap)) best = { at, gap }
    }
    return best?.at ?? null
  }

  function onBackgroundDown(event: ReactPointerEvent) {
    if (!interactive || gesture.current || !event.isPrimary) return
    const p = toCourt(event)
    const current = docRef.current

    switch (tool.kind) {
      case 'select':
        onSelect(null)
        return
      case 'player':
      case 'coach':
      case 'ball':
      case 'cone': {
        const id = newId()
        const piece: Piece =
          tool.kind === 'player' ? { id, kind: 'player', label: tool.label } : { id, kind: tool.kind }
        apply(addPiece(current, piece, p))
        onSelect({ type: 'piece', id })
        onPlaced(piece)
        // Holding on after placing carries the piece on, in the same undo step.
        gesture.current = { type: 'piece', pointerId: event.pointerId, id, offset: { x: 0, y: 0 }, moved: true }
        capture(event)
        return
      }
      case 'text':
        onRequestText(roundPoint(clampToView(p)))
        return
      case 'ballPath': {
        const extending = current.steps[stepIndex].marks.find(
          (mark): mark is Extract<Mark, { kind: 'ballPath' }> =>
            mark.kind === 'ballPath' && distance(last(mark.points), p) <= EXTEND_REACH
        )
        const start: PathPoint = extending
          ? last(extending.points)
          : (pieceNear(p, ['ball', 'player', 'coach']) ?? clampToView(p))
        setDraft({
          kind: 'ballPath',
          points: extending ? extending.points : [start],
          current: start,
          extending: extending?.id ?? null,
        })
        break
      }
      case 'arrow': {
        const from = pieceNear(p, ['player', 'coach']) ?? clampToView(p)
        setDraft({ kind: 'arrow', from, to: from })
        break
      }
      case 'zone':
        setDraft({ kind: 'zone', shape: tool.shape, fill: tool.fill, from: clampToView(p), to: clampToView(p) })
        break
      case 'ink':
        setDraft({ kind: 'ink', points: [clampToView(p)] })
        break
    }
    gesture.current = { type: 'draft', pointerId: event.pointerId }
    capture(event)
  }

  function onPieceDown(event: ReactPointerEvent, piece: Piece) {
    if (!interactive || gesture.current || !event.isPrimary || !PIECE_TOOLS.has(tool.kind)) return
    event.stopPropagation()
    const p = toCourt(event)
    const at = docRef.current.steps[stepIndex].positions[piece.id]
    onSelect({ type: 'piece', id: piece.id })
    gesture.current = {
      type: 'piece',
      pointerId: event.pointerId,
      id: piece.id,
      offset: { x: at.x - p.x, y: at.y - p.y },
      moved: false,
    }
    capture(event)
  }

  function onMarkDown(event: ReactPointerEvent, mark: Mark) {
    if (!interactive || gesture.current || !event.isPrimary || tool.kind !== 'select') return
    event.stopPropagation()
    onSelect({ type: 'mark', id: mark.id })
    gesture.current = { type: 'mark', pointerId: event.pointerId, id: mark.id, last: toCourt(event), moved: false }
    capture(event)
  }

  function onMove(event: ReactPointerEvent) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    const p = toCourt(event)
    const current = docRef.current

    if (active.type === 'piece') {
      apply(
        movePiece(current, stepIndex, active.id, { x: p.x + active.offset.x, y: p.y + active.offset.y }),
        !active.moved
      )
      active.moved = true
      return
    }
    if (active.type === 'mark') {
      const mark = current.steps[stepIndex].marks.find((m) => m.id === active.id)
      if (!mark) return
      const dx = p.x - active.last.x
      const dy = p.y - active.last.y
      if (Math.hypot(dx, dy) < 0.02) return
      apply(replaceMark(current, stepIndex, translateMark(mark, dx, dy)), !active.moved)
      active.last = p
      active.moved = true
      return
    }

    setDraft((previous) => {
      if (!previous) return previous
      const at = clampToView(p)
      switch (previous.kind) {
        case 'ballPath': {
          const snapped = snapToGlass(p)
          return { ...previous, current: snapped ? { ...snapped.point, glass: snapped.glass } : at }
        }
        case 'arrow':
          return { ...previous, to: at }
        case 'zone':
          return { ...previous, to: at }
        case 'ink':
          return distance(last(previous.points), at) < 0.05
            ? previous
            : { ...previous, points: [...previous.points, at] }
      }
    })
  }

  function finishDraft() {
    const draft = draftRef.current
    if (!draft) return
    const current = docRef.current
    if (draft.kind === 'ballPath') {
      if (distance(last(draft.points), draft.current) >= MIN_LENGTH) {
        const points = [...draft.points, draft.current].map(withRoundedPoint)
        const existing = current.steps[stepIndex].marks.find((mark) => mark.id === draft.extending)
        apply(
          existing
            ? replaceMark(current, stepIndex, { id: existing.id, kind: 'ballPath', points })
            : addMark(current, stepIndex, { id: newId(), kind: 'ballPath', points })
        )
      }
    } else {
      const mark = finishedMark(draft)
      if (mark) apply(addMark(current, stepIndex, mark))
    }
  }

  function onUp(event: ReactPointerEvent) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    if (active.type === 'draft') finishDraft()
    gesture.current = null
    setDraft(null)
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId)
  }

  function onCancel(event: ReactPointerEvent) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    gesture.current = null
    setDraft(null)
  }

  const shownDraft = draft && draftMark(draft)
  const piecesTouchable = interactive && PIECE_TOOLS.has(tool.kind)
  const marksTouchable = interactive && tool.kind === 'select'

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={svgViewBox}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full touch-none select-none"
        role="img"
        aria-label={label}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <BoardDefIdsContext.Provider value={defIds}>
          <UprightContext.Provider value={portrait ? -90 : 0}>
            <BoardDefs />
            <g ref={courtRef} transform={portrait ? 'rotate(90)' : undefined}>
              <Court labels={doc.labels} />
              <g>
                {marks.map((mark) => {
                  const selected = selection?.type === 'mark' && selection.id === mark.id
                  return (
                    <g key={mark.id} onPointerDown={marksTouchable ? (e) => onMarkDown(e, mark) : undefined}>
                      <MarkShape mark={mark} selected={selected} />
                      {marksTouchable && <MarkHitArea mark={mark} />}
                    </g>
                  )
                })}
                {shownDraft && (
                  <g pointerEvents="none" opacity={0.85}>
                    <MarkShape mark={shownDraft} />
                  </g>
                )}
              </g>
              <g>
                {doc.pieces.map((piece) => {
                  const at = positions[piece.id]
                  if (!at) return null
                  const selected = selection?.type === 'piece' && selection.id === piece.id
                  return (
                    <g
                      key={piece.id}
                      transform={`translate(${at.x} ${at.y})`}
                      onPointerDown={(e) => onPieceDown(e, piece)}
                      pointerEvents={piecesTouchable ? 'all' : 'none'}
                      style={{ cursor: piecesTouchable ? 'grab' : undefined }}
                    >
                      {/* A finger-sized target around small pieces, only when
                          moving: a placing tool must still place next to them. */}
                      {tool.kind === 'select' && <circle r={0.7} fill="transparent" />}
                      <PieceShape piece={piece} />
                      {selected && interactive && (
                        <circle
                          r={pieceRadius(piece) + 0.16}
                          fill="none"
                          stroke="#fff"
                          strokeWidth={0.07}
                          strokeDasharray="0.2 0.14"
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            </g>
          </UprightContext.Provider>
        </BoardDefIdsContext.Provider>
      </svg>
    </div>
  )
}
