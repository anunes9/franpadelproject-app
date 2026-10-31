// A Board's first Step, drawn still and small, as its thumbnail in the
// Coach's library.

import { useId, useMemo } from 'react'
import { BoardDefIdsContext, BoardDefs, Court } from './Court'
import type { BoardDocument } from './document'
import { viewBox } from './geometry'
import { MarkShape, PieceShape } from './glyphs'

export function BoardPreview({ doc, label }: { doc: BoardDocument; label: string }) {
  const reactId = useId()
  const ids = useMemo(() => ({ stripes: `${reactId}-stripes`, arrowhead: `${reactId}-arrowhead` }), [reactId])
  const box = viewBox(doc.view)
  const step = doc.steps[0]

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
        {step.marks.map((mark) => (
          <MarkShape key={mark.id} mark={mark} />
        ))}
        {doc.pieces.map((piece) => {
          const at = step.positions[piece.id]
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
