// A Board drawn still, without anything to touch: its first Step as a
// thumbnail, or, in the viewer, the Step shown or a moment between two.

import { useId, useMemo } from 'react'
import { BoardDefIdsContext, BoardDefs, Court } from './Court'
import type { BoardDocument, Mark } from './document'
import type { Point } from './geometry'
import { viewBox } from './geometry'
import { MarkShape, PieceShape } from './glyphs'

export function BoardPreview({
  doc,
  label,
  stepIndex = 0,
  frame = null,
}: {
  doc: BoardDocument
  label: string
  stepIndex?: number
  frame?: { positions: Record<string, Point>; marks: Mark[] } | null
}) {
  const reactId = useId()
  const ids = useMemo(() => ({ stripes: `${reactId}-stripes`, arrowhead: `${reactId}-arrowhead` }), [reactId])
  const box = viewBox(doc.view)
  const step = doc.steps[Math.min(stepIndex, doc.steps.length - 1)]
  const positions = frame?.positions ?? step.positions
  const marks = frame?.marks ?? step.marks

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className="h-full w-full"
    >
      <BoardDefIdsContext.Provider value={ids}>
        <BoardDefs />
        <Court labels={doc.labels} />
        {marks.map((mark) => (
          <MarkShape key={mark.id} mark={mark} />
        ))}
        {doc.pieces.map((piece) => {
          const at = positions[piece.id]
          return at ? (
            <g key={piece.id} transform={`translate(${at.x} ${at.y})`}>
              <PieceShape piece={piece} />
            </g>
          ) : null
        })}
      </BoardDefIdsContext.Provider>
    </svg>
  )
}
