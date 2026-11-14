import { describe, expect, it } from 'vitest'
import { radarPoint, radarPolygon } from './evaluations'

const center = { x: 100, y: 100 }

describe('radarPoint', () => {
  it('points the first axis straight up and the rest clockwise', () => {
    expect(radarPoint(0, 4, 1, center, 50)).toEqual({ x: 100, y: 50 })
    expect(radarPoint(1, 4, 1, center, 50)).toEqual({ x: 150, y: 100 })
    expect(radarPoint(2, 4, 1, center, 50)).toEqual({ x: 100, y: 150 })
  })

  it('scales by the fraction of the radius', () => {
    expect(radarPoint(0, 5, 0.4, center, 50)).toEqual({ x: 100, y: 80 })
  })
})

describe('radarPolygon', () => {
  it('draws each value at its share of the scale, and an unrated one at the centre', () => {
    expect(radarPolygon([5, null, 5, null], center, 50)).toBe('100,50 100,100 100,150 100,100')
  })
})
