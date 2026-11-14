// Moving the pieces from one Step to the next. Every piece glides from where
// it stands to where it stands next; the ball follows the Step's ball path
// when one starts at it, so the group sees the shot and not just its result.

import type { BoardDocument, PathPoint } from './document'
import type { Point } from './geometry'
import { distance, last } from './geometry'

// How far from the ball a ball path may start and still be the one it follows.
const PATH_PICKUP = 1.2

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

// The point a fraction `t` of the way along a polyline, by length.
export function alongPolyline(points: Point[], t: number): Point {
  if (points.length === 1) return points[0]
  const lengths = points.slice(1).map((p, i) => distance(points[i], p))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  if (total === 0) return points[0]
  let remaining = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      return lerp(points[i], points[i + 1], lengths[i] === 0 ? 1 : Math.min(1, remaining / lengths[i]))
    }
    remaining -= lengths[i]
  }
  return last(points)
}

// The route the ball takes from Step `from` to the next: along the Step's
// ball path that starts at the ball, then on to where it stands next if that
// isn't where the path ends. Without such a path, straight there.
export function ballRoute(doc: BoardDocument, from: number, ballId: string): Point[] {
  const start = doc.steps[from].positions[ballId]
  const end = doc.steps[from + 1]?.positions[ballId] ?? start
  const path = doc.steps[from].marks.find(
    (mark): mark is { id: string; kind: 'ballPath'; points: PathPoint[] } =>
      mark.kind === 'ballPath' && distance(mark.points[0], start) <= PATH_PICKUP
  )
  if (!path) return [start, end]
  const route: Point[] = [start, ...path.points.slice(1)]
  if (distance(last(route), end) > 0.05) route.push(end)
  return route
}

// Where every piece stands a fraction `t` of the way from Step `from` to the
// next.
export function positionsBetween(doc: BoardDocument, from: number, t: number): Record<string, Point> {
  const eased = easeInOut(t)
  const positions: Record<string, Point> = {}
  for (const piece of doc.pieces) {
    const a = doc.steps[from].positions[piece.id]
    const b = doc.steps[from + 1]?.positions[piece.id] ?? a
    if (!a) continue
    positions[piece.id] =
      piece.kind === 'ball' ? alongPolyline(ballRoute(doc, from, piece.id), eased) : lerp(a, b, eased)
  }
  return positions
}
