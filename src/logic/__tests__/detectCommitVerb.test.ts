import { describe, it, expect } from 'vitest'
import { detectCommitVerb } from '../classify/verb.js'

const stats = (insertions = 0, deletions = 0) => ({
  insertions,
  deletions,
  files: 1,
})

describe('detectCommitVerb', () => {
  it('returns add when a file is added', () => {
    const files = [{ path: 'src/auth.ts', status: 'A' as const }]
    expect(detectCommitVerb(files, stats())).toBe('add')
  })

  it('returns remove when a file is deleted', () => {
    const files = [{ path: 'old.ts', status: 'D' as const }]
    expect(detectCommitVerb(files, stats())).toBe('remove')
  })

  it('returns rename when a file is renamed', () => {
    const files = [{ path: 'src/a.ts', status: 'R' as const }]
    expect(detectCommitVerb(files, stats())).toBe('rename')
  })

  it('returns fix for small modification', () => {
    const files = [{ path: 'src/a.ts', status: 'M' as const }]
    expect(detectCommitVerb(files, stats(2, 1))).toBe('fix')
  })

  it('returns refactor for medium modification', () => {
    const files = [{ path: 'src/a.ts', status: 'M' as const }]
    expect(detectCommitVerb(files, stats(20, 10))).toBe('refactor')
  })

  it('returns update for large modification', () => {
    const files = [{ path: 'src/a.ts', status: 'M' as const }]
    expect(detectCommitVerb(files, stats(100, 50))).toBe('update')
  })

  it('returns refactor for mixed operations', () => {
    const files = [
      { path: 'src/a.ts', status: 'M' as const },
      { path: 'src/b.ts', status: 'M' as const },
    ]
    expect(detectCommitVerb(files, stats(10, 5))).toBe('refactor')
  })
})
