// The scratch Board kept in this browser, so that reloading the page doesn't
// lose it mid-explanation. It is a convenience only: storage may be missing,
// full or blocked, and then the Board simply starts blank.

import type { BoardDocument } from './document'
import { parseBoard } from './document'

const KEY = 'fpp.board.scratch'

// `source` is the Exercise a scratch Board was copied from, if any.
export function loadScratch(): { doc: BoardDocument; stepIndex: number; source: string | null } | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as { doc?: unknown; stepIndex?: unknown; source?: unknown }
    const doc = parseBoard(value.doc)
    if (!doc) return null
    const stepIndex =
      typeof value.stepIndex === 'number' && value.stepIndex >= 0 && value.stepIndex < doc.steps.length
        ? value.stepIndex
        : 0
    return { doc, stepIndex, source: typeof value.source === 'string' ? value.source : null }
  } catch {
    return null
  }
}

export function saveScratch(doc: BoardDocument, stepIndex: number, source: string | null = null) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ doc, stepIndex, source }))
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
