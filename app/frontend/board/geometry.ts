// The padel court of a Board, in metres, drawn in the academy's diagram style
// (docs/specs/Boards.md, "The court"). `x` runs 0–20 along the court, with
// the net at 10, and `y` runs 0–10 across it, so the court is landscape with
// a back wall at each end.

export interface Point {
  x: number
  y: number
}

export const COURT = {
  length: 20,
  width: 10,
  net: 10,
  // Service lines are 3 m from each back wall, 7 m from the net.
  serviceLine: 3,
} as const

// Room around the court for the sector and glass labels.
export const MARGIN = 1.4

export const COLORS = {
  court: '#6bb8a4',
  ink: '#132d46',
  line: '#ffffff',
  coach: '#cbd1d0',
  ball: '#c8e03c',
  cone: '#f28c28',
  tick: '#9aa3ad',
} as const

export type BoardView = 'full' | 'half'
export type BoardLabels = 'sectors' | 'glass' | 'none'

// The area the court is drawn in: the whole court, or the near half up to
// just past the net, each with the label margin.
export function viewBox(view: BoardView) {
  const right = view === 'full' ? COURT.length + MARGIN : COURT.net + 1
  return { x: -MARGIN, y: -MARGIN, width: right + MARGIN, height: COURT.width + 2 * MARGIN }
}

// The Fran Methodology sectors: depth zones along the court (0 around the
// service line to 3 around the net, mirrored) and lanes across it.
export const SECTOR_DEPTH_TICKS = [2, 4, 6, 8, 12, 14, 16, 18]
export const SECTOR_DEPTH_LABELS: [number, string][] = [
  [3, '0'],
  [5, '1'],
  [7, '2'],
  [10, '3'],
  [13, '2'],
  [15, '1'],
  [17, '0'],
]
export const SECTOR_LANE_TICKS = [2, 4, 6, 8]
export const SECTOR_LANE_LABELS: [number, string][] = [
  [1, '1'],
  [3, '2'],
  [5, 'J'],
  [7, '2'],
  [9, '1'],
]

// The walls, from the academy's glass drawing. Each back wall is five 2 m
// glass panels numbered 1, 2, 3, 2, 1; each side has two glass panels at each
// end (2 in the corner, then 1), mesh up to 1 m from the net, and a 2 m
// opening at the net.
export type GlassWall = 'back' | 'side'

export interface GlassPanel {
  wall: GlassWall
  number: 1 | 2 | 3
}

export interface WallSegment {
  from: Point
  to: Point
  // null for mesh, which takes no bounces.
  glass: GlassPanel | null
}

export const GLASS_COLORS: Record<string, string> = {
  'back-1': '#fccc2e',
  'back-2': '#6ab150',
  'back-3': '#1f3df0',
  'side-2': '#f68b2c',
  'side-1': '#e3101e',
}

export const glassColor = (panel: GlassPanel) => GLASS_COLORS[`${panel.wall}-${panel.number}`]

const BACK_NUMBERS = [1, 2, 3, 2, 1] as const

function buildWalls(): WallSegment[] {
  const walls: WallSegment[] = []
  for (const x of [0, COURT.length]) {
    BACK_NUMBERS.forEach((number, i) => {
      walls.push({ from: { x, y: i * 2 }, to: { x, y: i * 2 + 2 }, glass: { wall: 'back', number } })
    })
  }
  for (const y of [0, COURT.width]) {
    const side = (from: number, to: number, number: 1 | 2 | null) =>
      walls.push({ from: { x: from, y }, to: { x: to, y }, glass: number ? { wall: 'side', number } : null })
    side(0, 2, 2)
    side(2, 4, 1)
    side(4, 9, null)
    // 9–11: the opening at the net, no wall.
    side(11, 16, null)
    side(16, 18, 1)
    side(18, 20, 2)
  }
  return walls
}

export const WALLS = buildWalls()

// The glass numbers as the Glass labels show them: along each side, and
// across each back wall.
export const GLASS_SIDE_LABELS: [number, string][] = [
  [1, '2'],
  [3, '1'],
  [17, '1'],
  [19, '2'],
]
export const GLASS_BACK_LABELS: [number, string][] = BACK_NUMBERS.map((n, i) => [i * 2 + 1, String(n)])
export const GLASS_SIDE_TICKS = [6, 8, 12, 14]

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

// The point of segment a–b nearest to p.
export function nearestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return { ...a }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))
  return { x: a.x + t * dx, y: a.y + t * dy }
}

// How close to a glass panel a ball path's point must be to bounce off it.
export const GLASS_SNAP = 0.7

// The glass panel a point is close enough to bounce off, with the point moved
// onto it. Mesh and the opening at the net take no bounces.
export function snapToGlass(p: Point, tolerance = GLASS_SNAP): { point: Point; glass: GlassPanel } | null {
  let best: { point: Point; glass: GlassPanel; gap: number } | null = null
  for (const wall of WALLS) {
    if (!wall.glass) continue
    const point = nearestOnSegment(p, wall.from, wall.to)
    const gap = distance(p, point)
    if (gap <= tolerance && (!best || gap < best.gap)) best = { point, glass: wall.glass, gap }
  }
  return best && { point: best.point, glass: best.glass }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Pieces stand on the court, inside the walls.
export const clampToCourt = (p: Point): Point => ({
  x: clamp(p.x, 0, COURT.length),
  y: clamp(p.y, 0, COURT.width),
})

// Markings may reach a little past the walls, into the label margin.
export const clampToView = (p: Point): Point => ({
  x: clamp(p.x, -MARGIN / 2, COURT.length + MARGIN / 2),
  y: clamp(p.y, -MARGIN / 2, COURT.width + MARGIN / 2),
})

// A coordinate rounded to the centimetre, to keep documents small.
export const round = (value: number) => Math.round(value * 100) / 100
export const roundPoint = (p: Point): Point => ({ x: round(p.x), y: round(p.y) })

// The last item of a list that is never empty.
export const last = <T>(items: T[]): T => items[items.length - 1]
