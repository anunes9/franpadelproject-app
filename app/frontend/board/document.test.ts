import { describe, expect, it } from 'vitest'
import {
  addMark,
  addPiece,
  clearInk,
  emptyBoard,
  insertStepAfter,
  movePiece,
  parseBoard,
  placeable,
  removePiece,
  removeStep,
  translateMark,
} from './document'

const withPlayer = () => addPiece(emptyBoard(), { id: 'a', kind: 'player', label: 'A' }, { x: 4, y: 2 })

describe('pieces', () => {
  it('stands a new piece in every Step', () => {
    const board = addPiece(
      insertStepAfter(emptyBoard(), 0),
      { id: 'a', kind: 'player', label: 'A' },
      { x: 4.123, y: 2 }
    )
    expect(board.steps.map((step) => step.positions.a)).toEqual([
      { x: 4.12, y: 2 },
      { x: 4.12, y: 2 },
    ])
  })

  it('moves a piece in one Step only, inside the walls', () => {
    const board = movePiece(insertStepAfter(withPlayer(), 0), 1, 'a', { x: 25, y: 5 })
    expect(board.steps[0].positions.a).toEqual({ x: 4, y: 2 })
    expect(board.steps[1].positions.a).toEqual({ x: 20, y: 5 })
  })

  it('removes a piece from every Step', () => {
    const board = removePiece(insertStepAfter(withPlayer(), 0), 'a')
    expect(board.pieces).toEqual([])
    expect(board.steps.every((step) => !('a' in step.positions))).toBe(true)
  })

  it('places each of A–D, the Coach and the ball once, and cones freely', () => {
    let board = withPlayer()
    board = addPiece(board, { id: 'p', kind: 'coach' }, { x: 1, y: 5 })
    board = addPiece(board, { id: 'c1', kind: 'cone' }, { x: 8, y: 4 })
    expect(placeable(board)).toEqual({ players: ['B', 'C', 'D'], coach: false, ball: true })
  })
})

describe('Steps', () => {
  it('starts a new Step where the one before ends, with no markings', () => {
    let board = addMark(withPlayer(), 0, { id: 'm', kind: 'arrow', from: { x: 4, y: 2 }, to: { x: 6, y: 2 } })
    board = { ...board, steps: [{ ...board.steps[0], caption: 'Serve' }] }
    const next = insertStepAfter(board, 0)
    expect(next.steps[1]).toEqual({ caption: '', positions: { a: { x: 4, y: 2 } }, marks: [] })
  })

  it('always keeps one Step', () => {
    expect(removeStep(emptyBoard(), 0).steps).toHaveLength(1)
    expect(removeStep(insertStepAfter(emptyBoard(), 0), 0).steps).toHaveLength(1)
  })

  it('clears a Step’s drawing and keeps its other markings', () => {
    let board = addMark(emptyBoard(), 0, {
      id: 'i',
      kind: 'ink',
      points: [
        [1, 1],
        [2, 2],
      ],
    })
    board = addMark(board, 0, { id: 't', kind: 'text', x: 3, y: 3, text: 'serve' })
    expect(clearInk(board, 0).steps[0].marks.map((mark) => mark.id)).toEqual(['t'])
  })
})

describe('translateMark', () => {
  it('moves a ball path, which then no longer touches its glass', () => {
    const moved = translateMark(
      {
        id: 'b',
        kind: 'ballPath',
        points: [
          { x: 5, y: 5 },
          { x: 0, y: 3, glass: { wall: 'back', number: 2 } },
        ],
      },
      1,
      0.5
    )
    expect(moved).toEqual({
      id: 'b',
      kind: 'ballPath',
      points: [
        { x: 6, y: 5.5 },
        { x: 1, y: 3.5 },
      ],
    })
  })

  it('moves a circle zone by its centre', () => {
    const moved = translateMark({ id: 'z', kind: 'zone', shape: 'circle', fill: 'striped', cx: 3, cy: 3, r: 1 }, 1, -1)
    expect(moved).toMatchObject({ cx: 4, cy: 2, r: 1 })
  })
})

describe('parseBoard', () => {
  it('reads back a Board this version can open', () => {
    const board = withPlayer()
    expect(parseBoard(JSON.parse(JSON.stringify(board)))).toEqual(board)
  })

  it('refuses anything else', () => {
    expect(parseBoard(null)).toBeNull()
    expect(parseBoard({ ...emptyBoard(), version: 2 })).toBeNull()
    expect(parseBoard({ ...emptyBoard(), steps: [] })).toBeNull()
    expect(parseBoard({ ...emptyBoard(), labels: 'zones' })).toBeNull()
  })
})
