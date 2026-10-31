// Undo and redo for a Board, kept as the documents before and after the one
// shown. A drag records one entry when it starts, then updates the shown
// document as it goes, so undo takes the whole drag back at once.

import { useCallback, useReducer } from 'react'
import type { BoardDocument } from './document'
import { last } from './geometry'

// How many edits undo can take back.
const LIMIT = 100

export interface History {
  past: BoardDocument[]
  present: BoardDocument
  future: BoardDocument[]
}

type Action = { type: 'apply'; doc: BoardDocument; record: boolean } | { type: 'undo' } | { type: 'redo' }

export function historyReducer(state: History, action: Action): History {
  switch (action.type) {
    case 'apply':
      if (action.doc === state.present) return state
      if (!action.record) return { ...state, present: action.doc }
      return { past: [...state.past, state.present].slice(-LIMIT), present: action.doc, future: [] }
    case 'undo': {
      if (state.past.length === 0) return state
      const previous = last(state.past)
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] }
    }
    case 'redo': {
      const [next, ...future] = state.future
      if (!next) return state
      return { past: [...state.past, state.present], present: next, future }
    }
  }
}

export function useBoardHistory(initial: () => BoardDocument) {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: initial(),
    future: [],
  }))

  // `record: false` changes the shown document without a new undo entry, for
  // the moves of a drag after its first.
  const apply = useCallback((doc: BoardDocument, record = true) => dispatch({ type: 'apply', doc, record }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  return {
    doc: state.present,
    apply,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
