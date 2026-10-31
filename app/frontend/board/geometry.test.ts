import { describe, expect, it } from 'vitest'
import { clampToCourt, readableTextAngle, snapToGlass, viewBox, WALLS } from './geometry'

describe('the walls', () => {
  it('has five back glass panels at each end, numbered 1, 2, 3, 2, 1', () => {
    const left = WALLS.filter((wall) => wall.from.x === 0 && wall.to.x === 0)
    expect(left.map((wall) => wall.glass?.number)).toEqual([1, 2, 3, 2, 1])
    expect(left.every((wall) => wall.glass?.wall === 'back')).toBe(true)
  })

  it('has side glass 2 then 1 from each back wall, mesh, and an opening at the net', () => {
    const top = WALLS.filter((wall) => wall.from.y === 0 && wall.to.y === 0)
    expect(top.map((wall) => [wall.from.x, wall.to.x, wall.glass?.number ?? 'mesh'])).toEqual([
      [0, 2, 2],
      [2, 4, 1],
      [4, 9, 'mesh'],
      [11, 16, 'mesh'],
      [16, 18, 1],
      [18, 20, 2],
    ])
  })
})

describe('snapToGlass', () => {
  it('moves a point near the back wall onto its glass panel', () => {
    expect(snapToGlass({ x: 0.4, y: 5.2 })).toEqual({ point: { x: 0, y: 5.2 }, glass: { wall: 'back', number: 3 } })
  })

  it('names side glass by its number', () => {
    expect(snapToGlass({ x: 3, y: 9.6 })?.glass).toEqual({ wall: 'side', number: 1 })
  })

  it('takes the nearest panel in a corner', () => {
    expect(snapToGlass({ x: 0.5, y: 0.2 })?.glass).toEqual({ wall: 'side', number: 2 })
    expect(snapToGlass({ x: 0.2, y: 0.5 })?.glass).toEqual({ wall: 'back', number: 1 })
  })

  it('gives no bounce off the mesh, at the opening, or far from any wall', () => {
    expect(snapToGlass({ x: 6, y: 0.2 })).toBeNull()
    expect(snapToGlass({ x: 10, y: 0.2 })).toBeNull()
    expect(snapToGlass({ x: 5, y: 5 })).toBeNull()
  })
})

describe('the view', () => {
  it('shows the whole court, or the near half up to just past the net', () => {
    expect(viewBox('full').x).toBe(-1.4)
    expect(viewBox('full').width).toBeCloseTo(22.8)
    expect(viewBox('half').x + viewBox('half').width).toBeCloseTo(11)
  })

  it('keeps pieces inside the walls', () => {
    expect(clampToCourt({ x: -3, y: 12 })).toEqual({ x: 0, y: 10 })
  })
})

describe('readableTextAngle', () => {
  it('turns text with the court', () => {
    expect(readableTextAngle(0, 0)).toBe(0)
    expect(readableTextAngle(90, 0)).toBe(90)
    expect(readableTextAngle(45, 0)).toBe(45)
  })

  it('flips text that would read upside down on screen', () => {
    expect(readableTextAngle(180, 0)).toBe(360)
    expect(readableTextAngle(270, 0)).toBe(450)
    // On a portrait screen the court is turned 90°: text at 90° on the court
    // would read upside down, so it is flipped.
    expect(readableTextAngle(90, 90)).toBe(270)
    expect(readableTextAngle(0, 90)).toBe(0)
  })
})
