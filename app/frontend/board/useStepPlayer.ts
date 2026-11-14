// Moving through a Board's Steps: the Step shown, stepping on with the pieces
// animated to their next places, and playing every Step in turn. Shared by
// the Board screen and the read-only viewer on an Exercise's page.

import { useCallback, useEffect, useRef, useState } from 'react'
import { positionsBetween } from './animation'
import type { BoardDocument, Mark } from './document'
import type { Point } from './geometry'

// How long the pieces take to move from one Step to the next, and the pause
// between Steps when playing them all.
const STEP_MS = 1100
const PAUSE_MS = 500

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export interface StepPlayer {
  // The Step shown, always one the Board has.
  stepIndex: number
  // While animating: where the pieces are and the markings shown.
  frame: { positions: Record<string, Point>; marks: Mark[] } | null
  animating: boolean
  playing: boolean
  goTo: (index: number) => void
  next: () => Promise<void>
  previous: () => void
  play: () => Promise<void>
  stop: () => void
}

// `onMove` runs whenever the Step shown changes, as the Board screen drops
// its selection then.
export function useStepPlayer(doc: BoardDocument, initialStep = 0, onMove?: () => void): StepPlayer {
  const [rawIndex, setRawIndex] = useState(initialStep)
  const stepIndex = Math.min(rawIndex, doc.steps.length - 1)
  const [progress, setProgress] = useState<{ from: number; t: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const playingRef = useRef(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  // Undo can take the Step shown away; stay on one that exists.
  useEffect(() => {
    if (rawIndex > doc.steps.length - 1) setRawIndex(doc.steps.length - 1)
  }, [rawIndex, doc.steps.length])

  // Stop any animation when leaving the page.
  useEffect(() => () => cancelRef.current?.(), [])

  const goTo = useCallback((index: number) => {
    onMoveRef.current?.()
    setRawIndex(index)
  }, [])

  // Animates from Step `from` to the next; resolves false if stopped.
  const animateStep = useCallback((from: number) => {
    return new Promise<boolean>((resolve) => {
      if (prefersReducedMotion()) {
        resolve(true)
        return
      }
      let raf = 0
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / STEP_MS)
        setProgress({ from, t })
        if (t < 1) raf = requestAnimationFrame(tick)
        else {
          cancelRef.current = null
          resolve(true)
        }
      }
      raf = requestAnimationFrame(tick)
      cancelRef.current = () => {
        cancelAnimationFrame(raf)
        cancelRef.current = null
        resolve(false)
      }
    })
  }, [])

  const animating = progress !== null || playing
  const last = doc.steps.length - 1

  async function next() {
    if (animating || stepIndex >= last) return
    onMoveRef.current?.()
    const finished = await animateStep(stepIndex)
    setProgress(null)
    if (finished) setRawIndex(stepIndex + 1)
  }

  function previous() {
    if (animating || stepIndex === 0) return
    goTo(stepIndex - 1)
  }

  async function play() {
    if (animating || last < 1) return
    onMoveRef.current?.()
    playingRef.current = true
    setPlaying(true)
    let at = stepIndex
    // From the last Step, play starts again from the first.
    if (at === last) {
      at = 0
      setRawIndex(0)
      await wait(PAUSE_MS)
    }
    while (playingRef.current && at < last) {
      const finished = await animateStep(at)
      setProgress(null)
      if (!finished) break
      at += 1
      setRawIndex(at)
      if (at < last) await wait(PAUSE_MS)
    }
    playingRef.current = false
    setPlaying(false)
  }

  function stop() {
    playingRef.current = false
    cancelRef.current?.()
    setProgress(null)
    setPlaying(false)
  }

  const frame =
    progress && doc.steps[progress.from + 1]
      ? { positions: positionsBetween(doc, progress.from, progress.t), marks: doc.steps[progress.from].marks }
      : null

  return { stepIndex, frame, animating, playing, goTo, next, previous, play, stop }
}
