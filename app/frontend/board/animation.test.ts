import { describe, expect, it } from 'vitest'
import { alongPolyline, ballRoute, positionsBetween } from './animation'
import { addMark, addPiece, emptyBoard, insertStepAfter, movePiece } from './document'

// A serve: A at (2, 7) with the ball, and in Step 2 the ball by the far glass.
function serve() {
  let board = addPiece(emptyBoard(), { id: 'a', kind: 'player', label: 'A' }, { x: 2, y: 7 })
  board = addPiece(board, { id: 'b', kind: 'ball' }, { x: 2.5, y: 7 })
  board = insertStepAfter(board, 0)
  board = movePiece(board, 1, 'a', { x: 6, y: 7 })
  return movePiece(board, 1, 'b', { x: 19, y: 3 })
}

describe('alongPolyline', () => {
  it('goes by length, not by corner', () => {
    const route = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
    ]
    expect(alongPolyline(route, 0.5)).toEqual({ x: 2, y: 0 })
    expect(alongPolyline(route, 1)).toEqual({ x: 3, y: 1 })
  })
})

describe('ballRoute', () => {
  it('goes straight to the next Step without a ball path', () => {
    expect(ballRoute(serve(), 0, 'b')).toEqual([
      { x: 2.5, y: 7 },
      { x: 19, y: 3 },
    ])
  })

  it('follows the ball path that starts at the ball, then on to where it stands next', () => {
    const board = addMark(serve(), 0, {
      id: 'p',
      kind: 'ballPath',
      points: [
        { x: 2.6, y: 7 },
        { x: 14, y: 3 },
        { x: 20, y: 3, glass: { wall: 'back', number: 2 } },
      ],
    })
    expect(ballRoute(board, 0, 'b')).toEqual([
      { x: 2.5, y: 7 },
      { x: 14, y: 3 },
      { x: 20, y: 3, glass: { wall: 'back', number: 2 } },
      { x: 19, y: 3 },
    ])
  })

  it('ignores a ball path that starts somewhere else', () => {
    const board = addMark(serve(), 0, {
      id: 'p',
      kind: 'ballPath',
      points: [
        { x: 10, y: 1 },
        { x: 15, y: 1 },
      ],
    })
    expect(ballRoute(board, 0, 'b')).toHaveLength(2)
  })
})

describe('positionsBetween', () => {
  it('starts and ends where the two Steps stand', () => {
    const board = serve()
    expect(positionsBetween(board, 0, 0)).toEqual(board.steps[0].positions)
    expect(positionsBetween(board, 0, 1)).toEqual(board.steps[1].positions)
  })

  it('is half way at the middle', () => {
    expect(positionsBetween(serve(), 0, 0.5).a).toEqual({ x: 4, y: 7 })
  })
})
