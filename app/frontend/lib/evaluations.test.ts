import { describe, expect, it } from 'vitest'
import { radarPoint, radarPolygon, scaleLabel } from './evaluations'

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
    expect(radarPolygon([10, null, 5, null], center, 50)).toBe('100,50 100,100 100,125 100,100')
  })
})

describe('scaleLabel', () => {
  it('names each pair of steps of the 1-10 scale', () => {
    const t = (key: string) => key.split('.').pop() ?? key
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => scaleLabel(t, value))).toEqual([
      'beginning',
      'beginning',
      'developing',
      'developing',
      'consistent',
      'consistent',
      'proficient',
      'proficient',
      'mastered',
      'mastered',
    ])
  })
})
