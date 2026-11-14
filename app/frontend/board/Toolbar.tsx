// The small controls around a Board: tool buttons with a picture of what
// they draw, and segmented choices.

import type { ReactNode } from 'react'
import { BoardDefIdsContext } from './Court'
import type { Piece } from './document'
import { COLORS } from './geometry'
import { PieceShape } from './glyphs'

// A tool's picture, drawn with the Board's own shapes so the button looks
// like what it puts on the court.
export function ToolGlyph({ kind }: { kind: string }) {
  const piece = (p: Piece) => (
    <svg viewBox="-0.6 -0.6 1.2 1.2" className="h-6 w-6" aria-hidden="true">
      <PieceShape piece={p} />
    </svg>
  )
  const line = { stroke: COLORS.ink, fill: 'none', strokeLinecap: 'round' as const }
  switch (kind) {
    case 'players':
      return piece({ id: 'icon', kind: 'player', label: 'A' })
    case 'ball':
      return (
        <svg viewBox="-0.5 -0.5 1 1" className="h-6 w-6" aria-hidden="true">
          <PieceShape piece={{ id: 'icon', kind: 'ball' }} />
        </svg>
      )
    case 'cone':
      return (
        <svg viewBox="-0.45 -0.45 0.9 0.9" className="h-6 w-6" aria-hidden="true">
          <PieceShape piece={{ id: 'icon', kind: 'cone' }} />
        </svg>
      )
    case 'ballPath':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M4 19 L20 5" {...line} strokeWidth={2} strokeDasharray="2 4" />
        </svg>
      )
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M4 19 L18 6 M11 6 H18 V13" {...line} strokeWidth={2} strokeLinejoin="round" />
        </svg>
      )
    case 'zone':
      return (
        <BoardDefIdsContext.Provider value={{ stripes: 'tool-stripes', arrowhead: 'tool-arrowhead' }}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <defs>
              <pattern
                id="tool-stripes"
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="4" stroke={COLORS.ink} strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect x="4" y="5" width="16" height="14" fill="url(#tool-stripes)" stroke={COLORS.ink} strokeWidth={1.5} />
          </svg>
        </BoardDefIdsContext.Provider>
      )
    case 'text':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <text
            x="12"
            y="13"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="17"
            fontWeight={700}
            fill={COLORS.ink}
          >
            T
          </text>
        </svg>
      )
    case 'ink':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M3 16 C 6 8, 9 8, 10 13 S 15 19, 17 11 S 20 6, 21 8" {...line} strokeWidth={2} />
        </svg>
      )
    default:
      // Move: a pointer.
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M6 3 L18 13 L12.5 13.6 L15.5 20 L13 21 L10 14.6 L6 18 Z" fill={COLORS.ink} strokeLinejoin="round" />
        </svg>
      )
  }
}

export function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'flex min-h-14 min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-label font-semibold transition-colors ' +
        (active ? 'bg-tint-teal text-teal-ink ring-2 ring-teal-deep' : 'text-muted-strong hover:bg-mist')
      }
    >
      {children}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; disabled?: boolean }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex shrink-0 items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <div className="flex rounded-lg bg-track p-0.5 shadow-well">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={
              'min-h-10 whitespace-nowrap rounded-md px-3 text-meta font-semibold transition-colors disabled:opacity-40 ' +
              (option.value === value ? 'bg-white text-ink shadow-chip' : 'text-muted hover:text-ink')
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function BarButton({
  onClick,
  disabled,
  label,
  children,
  tone = 'plain',
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: ReactNode
  tone?: 'plain' | 'danger' | 'primary'
}) {
  const tones = {
    plain: 'text-ink hover:bg-mist',
    danger: 'text-danger hover:bg-tint-clay',
    primary: 'bg-ink text-paper hover:bg-ink-soft',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-meta font-semibold transition-colors disabled:opacity-35 disabled:hover:bg-transparent ${tones[tone]}`}
    >
      {children}
    </button>
  )
}
