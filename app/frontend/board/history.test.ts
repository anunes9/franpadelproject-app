import { describe, expect, it } from 'vitest'
import { emptyBoard } from './document'
import { type History, historyReducer } from './history'

const board = (view: 'full' | 'half') => ({ ...emptyBoard(), view })
const initial = (): History => ({ past: [], present: board('full'), future: [] })

describe('undo and redo', () => {
  it('takes back an edit and puts it back', () => {
    const start = initial()
    const edited = historyReducer(start, { type: 'apply', doc: board('half'), record: true })
    const undone = historyReducer(edited, { type: 'undo' })
    expect(undone.present.view).toBe('full')
    expect(historyReducer(undone, { type: 'redo' }).present.view).toBe('half')
  })

  it('takes a whole drag back at once', () => {
    let state = initial()
    state = historyReducer(state, { type: 'apply', doc: board('half'), record: true })
    state = historyReducer(state, { type: 'apply', doc: board('full'), record: false })
    state = historyReducer(state, { type: 'apply', doc: board('half'), record: false })
    expect(state.past).toHaveLength(1)
  })

  it('forgets what was undone once there is a new edit', () => {
    let state = initial()
    state = historyReducer(state, { type: 'apply', doc: board('half'), record: true })
    state = historyReducer(state, { type: 'undo' })
    state = historyReducer(state, { type: 'apply', doc: board('half'), record: true })
    expect(state.future).toEqual([])
  })

  it('does nothing with nothing to undo', () => {
    const state = initial()
    expect(historyReducer(state, { type: 'undo' })).toBe(state)
  })
})
