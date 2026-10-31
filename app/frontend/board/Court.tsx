// The padel court of a Board in the academy's diagram style: a teal court
// with white lines, the logo faint in each back strip, and either the Fran
// Methodology sectors, the glass panels in their colours, or no labels.

import { createContext, type ReactNode, useContext } from 'react'
import type { BoardLabels } from './geometry'
import {
  COLORS,
  COURT,
  GLASS_BACK_LABELS,
  GLASS_SIDE_LABELS,
  GLASS_SIDE_TICKS,
  glassColor,
  SECTOR_DEPTH_LABELS,
  SECTOR_DEPTH_TICKS,
  SECTOR_LANE_LABELS,
  SECTOR_LANE_TICKS,
  WALLS,
} from './geometry'

// On a portrait screen the court is drawn turned 90°, and every letter on it
// is turned back by this many degrees so it still reads upright.
export const UprightContext = createContext(0)

// Children drawn at (x, y), turned to read upright on screen.
export function Upright({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const angle = useContext(UprightContext)
  return <g transform={`translate(${x} ${y})${angle ? ` rotate(${angle})` : ''}`}>{children}</g>
}

export const FONT = 'Archivo, system-ui, sans-serif'

// The ids of the pattern and marker a Board's markings use, unique per Board
// so that several Boards can share a page.
export interface BoardDefIds {
  stripes: string
  arrowhead: string
}

export const BoardDefIdsContext = createContext<BoardDefIds>({ stripes: 'board-stripes', arrowhead: 'board-arrowhead' })

export function BoardDefs() {
  const ids = useContext(BoardDefIdsContext)
  return (
    <defs>
      <pattern id={ids.stripes} width="0.25" height="0.25" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="0.25" stroke={COLORS.ink} strokeWidth="0.04" />
      </pattern>
      <marker
        id={ids.arrowhead}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill={COLORS.ink} />
      </marker>
    </defs>
  )
}

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <Upright x={x} y={y}>
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT}
        letterSpacing={0}
        fontWeight={700}
        fontSize={0.8}
        fill={COLORS.ink}
      >
        {children}
      </text>
    </Upright>
  )
}

// Labels sit outside the walls: depth along the top and bottom, lanes or
// back glass at each end.
const TOP = -0.75
const BOTTOM = COURT.width + 0.75
const LEFT = -0.75
const RIGHT = COURT.length + 0.75

function Sectors() {
  return (
    <g>
      {SECTOR_DEPTH_TICKS.flatMap((x) => [
        <line key={`t${x}`} x1={x} y1={-0.33} x2={x} y2={0} stroke={COLORS.ink} strokeWidth={0.11} />,
        <line
          key={`b${x}`}
          x1={x}
          y1={COURT.width}
          x2={x}
          y2={COURT.width + 0.33}
          stroke={COLORS.ink}
          strokeWidth={0.11}
        />,
      ])}
      {SECTOR_LANE_TICKS.flatMap((y) => [
        <line key={`l${y}`} x1={-0.33} y1={y} x2={0} y2={y} stroke={COLORS.ink} strokeWidth={0.11} />,
        <line
          key={`r${y}`}
          x1={COURT.length}
          y1={y}
          x2={COURT.length + 0.33}
          y2={y}
          stroke={COLORS.ink}
          strokeWidth={0.11}
        />,
      ])}
      {SECTOR_DEPTH_LABELS.flatMap(([x, label]) => [
        <Label key={`t${x}`} x={x} y={TOP}>
          {label}
        </Label>,
        <Label key={`b${x}`} x={x} y={BOTTOM}>
          {label}
        </Label>,
      ])}
      {SECTOR_LANE_LABELS.flatMap(([y, label]) => [
        <Label key={`l${y}`} x={LEFT} y={y}>
          {label}
        </Label>,
        <Label key={`r${y}`} x={RIGHT} y={y}>
          {label}
        </Label>,
      ])}
    </g>
  )
}

function GlassLabels() {
  return (
    <g>
      {GLASS_SIDE_TICKS.flatMap((x) => [
        <line key={`t${x}`} x1={x} y1={-0.3} x2={x} y2={-0.11} stroke={COLORS.tick} strokeWidth={0.06} />,
        <line
          key={`b${x}`}
          x1={x}
          y1={COURT.width + 0.11}
          x2={x}
          y2={COURT.width + 0.3}
          stroke={COLORS.tick}
          strokeWidth={0.06}
        />,
      ])}
      {GLASS_SIDE_LABELS.flatMap(([x, label]) => [
        <Label key={`t${x}`} x={x} y={TOP}>
          {label}
        </Label>,
        <Label key={`b${x}`} x={x} y={BOTTOM}>
          {label}
        </Label>,
      ])}
      {GLASS_BACK_LABELS.flatMap(([y, label]) => [
        <Label key={`l${y}`} x={LEFT} y={y}>
          {label}
        </Label>,
        <Label key={`r${y}`} x={RIGHT} y={y}>
          {label}
        </Label>,
      ])}
    </g>
  )
}

// The logo, faint, along each back strip.
function Watermarks() {
  // The logo file is 409.69 × 170.15.
  const width = 6.4
  const height = (width * 170.15) / 409.69
  const logo = (x: number, angle: number) => (
    <image
      href="/fran-padel-project-logo.svg"
      x={-width / 2}
      y={-height / 2}
      width={width}
      height={height}
      transform={`translate(${x} ${COURT.width / 2}) rotate(${angle})`}
      opacity={0.08}
      style={{ filter: 'brightness(0)' }}
    />
  )
  return (
    <g pointerEvents="none">
      {logo(COURT.serviceLine / 2, -90)}
      {logo(COURT.length - COURT.serviceLine / 2, 90)}
    </g>
  )
}

export function Court({ labels }: { labels: BoardLabels }) {
  const line = { stroke: COLORS.line, strokeWidth: 0.11 }
  return (
    <g>
      <rect x={0} y={0} width={COURT.length} height={COURT.width} fill={COLORS.court} />
      <Watermarks />
      <line x1={COURT.serviceLine} y1={0} x2={COURT.serviceLine} y2={COURT.width} {...line} />
      <line
        x1={COURT.length - COURT.serviceLine}
        y1={0}
        x2={COURT.length - COURT.serviceLine}
        y2={COURT.width}
        {...line}
      />
      <line
        x1={COURT.serviceLine}
        y1={COURT.width / 2}
        x2={COURT.length - COURT.serviceLine}
        y2={COURT.width / 2}
        {...line}
      />
      <line x1={COURT.net} y1={0} x2={COURT.net} y2={COURT.width} {...line} />
      <rect x={COURT.net + 0.06} y={0} width={0.08} height={COURT.width} fill="#000" opacity={0.25} />
      {labels === 'glass' ? (
        WALLS.map((wall) => (
          <line
            key={`${wall.from.x},${wall.from.y}-${wall.to.x},${wall.to.y}`}
            x1={wall.from.x}
            y1={wall.from.y}
            x2={wall.to.x}
            y2={wall.to.y}
            stroke={wall.glass ? glassColor(wall.glass) : COLORS.ink}
            strokeWidth={0.22}
          />
        ))
      ) : (
        <rect x={0} y={0} width={COURT.length} height={COURT.width} fill="none" stroke={COLORS.ink} strokeWidth={0.2} />
      )}
      {labels === 'sectors' && <Sectors />}
      {labels === 'glass' && <GlassLabels />}
    </g>
  )
}
