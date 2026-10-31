// The scratch Board kept in this browser, so that reloading the page doesn't
// lose it mid-explanation. It is a convenience only: storage may be missing,
// full or blocked, and then the Board simply starts blank.

import type { BoardDocument } from './document'
import { parseBoard } from './document'

const KEY = 'fpp.board.scratch'

export function loadScratch(): { doc: BoardDocument; stepIndex: number } | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as { doc?: unknown; stepIndex?: unknown }
    const doc = parseBoard(value.doc)
    if (!doc) return null
    const stepIndex =
      typeof value.stepIndex === 'number' && value.stepIndex >= 0 && value.stepIndex < doc.steps.length
        ? value.stepIndex
        : 0
    return { doc, stepIndex }
  } catch {
    return null
  }
}

export function saveScratch(doc: BoardDocument, stepIndex: number) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ doc, stepIndex }))
  } catch {
    // Without storage the Board still works; it just won't survive a reload.
  }
}

export function clearScratch() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing kept, nothing to clear.
  }
}
