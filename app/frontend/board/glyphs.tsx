// How each piece and marking of a Board is drawn, following the academy's
// diagrams: navy tokens for A and B, white for C and D, grey for the Coach,
// a dashed navy ball path and striped zones.

import { useContext } from 'react'
import { BoardDefIdsContext, FONT, Upright } from './Court'
import type { Mark, PathPoint, Piece } from './document'
import { pairOf } from './document'
import type { Point } from './geometry'
import { COLORS, glassColor } from './geometry'

export const TOKEN_RADIUS = 0.55
export const BALL_RADIUS = 0.3

function Token({ fill, edge, color, letter }: { fill: string; edge: string; color: string; letter: string }) {
  return (
    <>
      <circle r={TOKEN_RADIUS} fill={fill} stroke={edge} strokeWidth={0.03} />
      <Upright x={0} y={0}>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT}
          letterSpacing={0}
          fontWeight={500}
          fontSize={0.75}
          fill={color}
        >
          {letter}
        </text>
      </Upright>
    </>
  )
}

export function PieceShape({ piece }: { piece: Piece }) {
  switch (piece.kind) {
    case 'player':
      return pairOf(piece.label) === 'ab' ? (
        <Token fill={COLORS.ink} edge="#000" color="#fff" letter={piece.label} />
      ) : (
        <Token fill="#fff" edge={COLORS.ink} color={COLORS.ink} letter={piece.label} />
      )
    case 'coach':
      return <Token fill={COLORS.coach} edge="#000" color={COLORS.ink} letter="P" />
    case 'ball':
      return (
        <>
          <circle r={BALL_RADIUS} fill={COLORS.ball} stroke={COLORS.ink} strokeWidth={0.03} />
          <path
            d="M -0.21 -0.21 Q 0.05 0 -0.21 0.21 M 0.21 -0.21 Q -0.05 0 0.21 0.21"
            fill="none"
            stroke="#fff"
            strokeWidth={0.05}
            strokeLinecap="round"
          />
        </>
      )
    case 'cone':
      // A cone stands upright whichever way the court is turned.
      return (
        <Upright x={0} y={0}>
          <path
            d="M 0 -0.3 L 0.26 0.2 L -0.26 0.2 Z"
            fill={COLORS.cone}
            stroke={COLORS.ink}
            strokeWidth={0.03}
            strokeLinejoin="round"
          />
        </Upright>
      )
  }
}

// How far a piece reaches from its centre, for its selection ring.
export const pieceRadius = (piece: Piece) =>
  piece.kind === 'ball' ? BALL_RADIUS : piece.kind === 'cone' ? 0.32 : TOKEN_RADIUS

const pointsAttr = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(' ')

// A bounce off the glass shows the panel's number in its colour.
function GlassBadge({ point }: { point: PathPoint }) {
  if (!point.glass) return null
  const fill = glassColor(point.glass)
  const dark = point.glass.number === 3 || (point.glass.wall === 'side' && point.glass.number === 1)
  return (
    <g transform={`translate(${point.x} ${point.y})`}>
      <circle r={0.3} fill={fill} stroke="#fff" strokeWidth={0.05} />
      <Upright x={0} y={0}>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT}
          letterSpacing={0}
          fontWeight={700}
          fontSize={0.38}
          fill={dark ? '#fff' : COLORS.ink}
        >
          {point.glass.number}
        </text>
      </Upright>
    </g>
  )
}

// A bounce on the floor is a small cross.
function FloorBounce({ point }: { point: Point }) {
  const s = 0.14
  return (
    <path
      d={`M ${point.x - s} ${point.y - s} L ${point.x + s} ${point.y + s} M ${point.x + s} ${point.y - s} L ${point.x - s} ${point.y + s}`}
      stroke={COLORS.ink}
      strokeWidth={0.06}
      strokeLinecap="round"
    />
  )
}

// The outline a selected marking gets: the same shape, wider, in white.
const HALO = { stroke: '#fff', strokeOpacity: 0.85, fill: 'none', strokeLinecap: 'round' as const }

export function MarkShape({ mark, selected = false }: { mark: Mark; selected?: boolean }) {
  const ids = useContext(BoardDefIdsContext)
  switch (mark.kind) {
    case 'ballPath': {
      const inner = mark.points.slice(1, -1)
      return (
        <g>
          {selected && <polyline points={pointsAttr(mark.points)} {...HALO} strokeWidth={0.22} />}
          <polyline
            points={pointsAttr(mark.points)}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={0.05}
            strokeDasharray="0.18 0.36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {inner.map((point) => (point.glass ? null : <FloorBounce key={`f${point.x},${point.y}`} point={point} />))}
          {mark.points.map((point) =>
            point.glass ? <GlassBadge key={`g${point.x},${point.y}`} point={point} /> : null
          )}
        </g>
      )
    }
    case 'arrow':
      return (
        <g>
          {selected && (
            <line x1={mark.from.x} y1={mark.from.y} x2={mark.to.x} y2={mark.to.y} {...HALO} strokeWidth={0.25} />
          )}
          <line
            x1={mark.from.x}
            y1={mark.from.y}
            x2={mark.to.x}
            y2={mark.to.y}
            stroke={COLORS.ink}
            strokeWidth={0.07}
            strokeLinecap="round"
            markerEnd={`url(#${ids.arrowhead})`}
          />
        </g>
      )
    case 'zone': {
      const style = {
        fill: mark.fill === 'striped' ? `url(#${ids.stripes})` : 'none',
        stroke: COLORS.ink,
        strokeWidth: mark.fill === 'striped' ? 0.035 : 0.05,
      }
      return mark.shape === 'rect' ? (
        <g>
          {selected && <rect x={mark.x} y={mark.y} width={mark.w} height={mark.h} {...HALO} strokeWidth={0.2} />}
          <rect x={mark.x} y={mark.y} width={mark.w} height={mark.h} {...style} />
        </g>
      ) : (
        <g>
          {selected && <circle cx={mark.cx} cy={mark.cy} r={mark.r} {...HALO} strokeWidth={0.2} />}
          <circle cx={mark.cx} cy={mark.cy} r={mark.r} {...style} />
        </g>
      )
    }
    case 'text':
      return (
        <Upright x={mark.x} y={mark.y}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT}
            letterSpacing={0}
            fontWeight={700}
            fontSize={0.6}
            fill={COLORS.ink}
            stroke={selected ? '#fff' : 'none'}
            strokeWidth={selected ? 0.16 : 0}
            paintOrder="stroke"
          >
            {mark.text}
          </text>
        </Upright>
      )
    case 'ink':
      return (
        <g>
          {selected && (
            <polyline points={mark.points.map(([x, y]) => `${x},${y}`).join(' ')} {...HALO} strokeWidth={0.24} />
          )}
          <polyline
            points={mark.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={0.09}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )
  }
}

// An invisible, wider copy of a marking that is easy to tap with a finger.
export function MarkHitArea({ mark }: { mark: Mark }) {
  const hit = { stroke: 'transparent', strokeWidth: 0.7, fill: 'none', pointerEvents: 'stroke' as const }
  switch (mark.kind) {
    case 'ballPath':
      return <polyline points={pointsAttr(mark.points)} {...hit} />
    case 'arrow':
      return <line x1={mark.from.x} y1={mark.from.y} x2={mark.to.x} y2={mark.to.y} {...hit} />
    case 'ink':
      return <polyline points={mark.points.map(([x, y]) => `${x},${y}`).join(' ')} {...hit} />
    case 'zone':
      return mark.shape === 'rect' ? (
        <rect x={mark.x} y={mark.y} width={mark.w} height={mark.h} fill="transparent" pointerEvents="all" />
      ) : (
        <circle cx={mark.cx} cy={mark.cy} r={mark.r} fill="transparent" pointerEvents="all" />
      )
    case 'text': {
      // Roughly the text's box: 0.6 m tall, about 0.36 m per character.
      const width = Math.max(1, mark.text.length * 0.36) + 0.4
      return (
        <Upright x={mark.x} y={mark.y}>
          <rect x={-width / 2} y={-0.5} width={width} height={1} fill="transparent" pointerEvents="all" />
        </Upright>
      )
    }
  }
}
