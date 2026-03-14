import { describe, it, expect } from 'vitest'
import { selectCommitVerb } from '../verb.js'
import type { CommitSignals } from '../../analysis/signals.js'
import type { StagedFile } from '../../git/staged.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSignals(overrides: Partial<CommitSignals> = {}): CommitSignals {
  return {
    files: [],
    stats: { files: 1, insertions: 0, deletions: 0 },
    diff: {
      addedSymbols: [],
      removedSymbols: [],
      hasFixPattern: false,
      hasTestPattern: false,
      netLines: 0,
      addedPackages: [],
    },
    category: 'code',
    scope: null,
    ...overrides,
  }
}

function files(...statuses: Array<StagedFile['status']>): StagedFile[] {
  return statuses.map((status, i) => ({ status, path: `src/file${i}.ts` }))
}

function stats(insertions: number, deletions: number, fileCount = 1) {
  return { files: fileCount, insertions, deletions }
}

function withSymbols(added: string[], removed: string[] = []) {
  return {
    addedSymbols: added,
    removedSymbols: removed,
    hasFixPattern: false,
    hasTestPattern: false,
    netLines: added.length - removed.length,
    addedPackages: [],
  }
}

function withFixPattern(insertions = 10, deletions = 5) {
  return {
    addedSymbols: [],
    removedSymbols: [],
    hasFixPattern: true,
    hasTestPattern: false,
    netLines: insertions - deletions,
    addedPackages: [],
  }
}

// ---------------------------------------------------------------------------
// 1. Structural file operations
// ---------------------------------------------------------------------------

describe('selectCommitVerb — structural file operations', () => {
  it('returns "rename" when every file is renamed', () => {
    const signals = makeSignals({ files: files('R', 'R') })
    expect(selectCommitVerb(signals)).toBe('rename')
  })

  it('returns "rename" for a single renamed file', () => {
    const signals = makeSignals({ files: files('R') })
    expect(selectCommitVerb(signals)).toBe('rename')
  })

  it('returns "remove" when every file is deleted', () => {
    const signals = makeSignals({ files: files('D', 'D') })
    expect(selectCommitVerb(signals)).toBe('remove')
  })

  it('returns "remove" for a single deleted file', () => {
    const signals = makeSignals({ files: files('D') })
    expect(selectCommitVerb(signals)).toBe('remove')
  })

  it('does NOT return "rename" when renames are mixed with modifications', () => {
    const signals = makeSignals({ files: files('R', 'M') })
    expect(selectCommitVerb(signals)).not.toBe('rename')
  })

  it('does NOT return "remove" when deletes are mixed with modifications (balanced stats)', () => {
    // 5 insertions, 10 deletions → deletions(10) is NOT > insertions(5) * 4 = 20 → should NOT be "remove"
    const signals = makeSignals({
      files: files('D', 'M'),
      stats: stats(5, 10),
    })
    expect(selectCommitVerb(signals)).not.toBe('remove')
  })
})

// ---------------------------------------------------------------------------
// 2. Revert detection via symbol name
// ---------------------------------------------------------------------------

describe('selectCommitVerb — revert detection', () => {
  it('returns "revert" when the primary added symbol starts with "revert"', () => {
    const signals = makeSignals({
      files: files('M'),
      diff: withSymbols(['revertAuthChanges']),
    })
    expect(selectCommitVerb(signals)).toBe('revert')
  })

  it('returns "revert" when the symbol is exactly "revert" (lowercase)', () => {
    const signals = makeSignals({
      files: files('M'),
      diff: withSymbols(['revert']),
    })
    expect(selectCommitVerb(signals)).toBe('revert')
  })

  it('does NOT return "revert" for unrelated symbol names', () => {
    const signals = makeSignals({
      files: files('M'),
      diff: withSymbols(['parseConfig']),
      stats: stats(20, 5),
    })
    expect(selectCommitVerb(signals)).not.toBe('revert')
  })
})

// ---------------------------------------------------------------------------
// 3. Fix / error pattern in the diff
// ---------------------------------------------------------------------------

describe('selectCommitVerb — fix pattern', () => {
  it('returns "fix" for a small fix (≤ 15 total changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(5, 3),
      diff: withFixPattern(5, 3),
    })
    expect(selectCommitVerb(signals)).toBe('fix')
  })

  it('returns "fix" at exactly 15 total changes', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(10, 5),
      diff: withFixPattern(10, 5),
    })
    expect(selectCommitVerb(signals)).toBe('fix')
  })

  it('returns "handle" for a larger fix (> 15 total changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(20, 10),
      diff: withFixPattern(20, 10),
    })
    expect(selectCommitVerb(signals)).toBe('handle')
  })

  it('returns "handle" for a very large fix with many changes', () => {
    const signals = makeSignals({
      files: files('M', 'M'),
      stats: stats(50, 30),
      diff: withFixPattern(50, 30),
    })
    expect(selectCommitVerb(signals)).toBe('handle')
  })

  it('fix pattern takes priority over symbol verb prefix', () => {
    // Even if the symbol has a known prefix, fix pattern should win
    const signals = makeSignals({
      files: files('M'),
      stats: stats(3, 2),
      diff: {
        addedSymbols: ['setupDatabase'],
        removedSymbols: [],
        hasFixPattern: true,
        hasTestPattern: false,
        netLines: 1,
        addedPackages: [],
      },
    })
    expect(selectCommitVerb(signals)).toBe('fix')
  })
})

// ---------------------------------------------------------------------------
// 4. Symbol-based verb extraction
// ---------------------------------------------------------------------------

describe('selectCommitVerb — symbol verb prefix extraction', () => {
  const symbolCases: [string, string][] = [
    ['migrateUserTable', 'migrate'],
    ['configureRouter', 'configure'],
    ['setupDatabase', 'setup'],
    ['bootstrapApp', 'bootstrap'],
    ['initializeLogger', 'initialize'],
    ['initClient', 'init'],
    ['implementPayment', 'implement'],
    ['validateUserEmail', 'validate'],
    ['parseConfigFile', 'parse'],
    ['generateReport', 'generate'],
    ['transformPayload', 'transform'],
    ['extractTokenClaims', 'extract'],
    ['processQueue', 'process'],
    ['registerRoutes', 'register'],
    ['handleRequest', 'handle'],
    ['fetchUserProfile', 'fetch'],
    ['loadSettings', 'load'],
    ['createUserRecord', 'create'],
    ['buildBundle', 'build'],
  ]

  for (const [symbol, expectedVerb] of symbolCases) {
    it(`returns "${expectedVerb}" for symbol "${symbol}"`, () => {
      const signals = makeSignals({
        files: files('A'),
        stats: stats(20, 0),
        diff: withSymbols([symbol]),
      })
      expect(selectCommitVerb(signals)).toBe(expectedVerb)
    })
  }

  it('does NOT extract a verb from a class name with no verb prefix', () => {
    // "UserAuthService" has no known verb prefix, should fall through
    const signals = makeSignals({
      files: files('A'),
      stats: stats(30, 0),
      diff: withSymbols(['UserAuthService']),
    })
    // Falls through to status heuristic: has A and no D → "add"
    expect(selectCommitVerb(signals)).toBe('add')
  })

  it('does NOT match a partial verb (e.g. "setups" is not "setup")', () => {
    // "setups" starts with "setup" but next char is 's' (lowercase), not a boundary
    const signals = makeSignals({
      files: files('A'),
      stats: stats(10, 0),
      diff: withSymbols(['setups']),
    })
    expect(selectCommitVerb(signals)).not.toBe('setup')
  })

  it('uses the first added symbol, not subsequent ones', () => {
    const signals = makeSignals({
      files: files('A'),
      stats: stats(40, 0),
      diff: withSymbols(['validateInput', 'parseOutput']),
    })
    expect(selectCommitVerb(signals)).toBe('validate')
  })
})

// ---------------------------------------------------------------------------
// 5. Modification-only magnitude heuristics
// ---------------------------------------------------------------------------

describe('selectCommitVerb — modification-only heuristics', () => {
  it('returns "fix" for a tiny modification (≤ 5 total changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(2, 1),
    })
    expect(selectCommitVerb(signals)).toBe('fix')
  })

  it('returns "fix" at exactly 5 total changes', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(3, 2),
    })
    expect(selectCommitVerb(signals)).toBe('fix')
  })

  it('returns "refactor" for a contained modification (6–30 changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(15, 5),
    })
    expect(selectCommitVerb(signals)).toBe('refactor')
  })

  it('returns "refactor" at exactly 30 total changes', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(20, 10),
    })
    expect(selectCommitVerb(signals)).toBe('refactor')
  })

  it('returns "update" for a medium modification (31–80 changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(40, 20),
    })
    expect(selectCommitVerb(signals)).toBe('update')
  })

  it('returns "update" at exactly 80 total changes', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(50, 30),
    })
    expect(selectCommitVerb(signals)).toBe('update')
  })

  it('returns "refactor" for a large modification (> 80 changes)', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(60, 30),
    })
    expect(selectCommitVerb(signals)).toBe('refactor')
  })

  it('does NOT apply magnitude heuristic when multiple status types are present', () => {
    // A + M is not "only modified" — should not use size-based verb
    const signals = makeSignals({
      files: files('A', 'M'),
      stats: stats(3, 1),
    })
    expect(selectCommitVerb(signals)).not.toBe('fix')
  })
})

// ---------------------------------------------------------------------------
// 6. Catch-all status-based heuristics
// ---------------------------------------------------------------------------

describe('selectCommitVerb — catch-all status heuristics', () => {
  it('returns "add" when only additions are present', () => {
    const signals = makeSignals({
      files: files('A', 'A'),
      stats: stats(50, 0),
    })
    expect(selectCommitVerb(signals)).toBe('add')
  })

  it('returns "add" for mixed adds and modifications (no deletes)', () => {
    const signals = makeSignals({
      files: files('A', 'M'),
      stats: stats(30, 5),
    })
    expect(selectCommitVerb(signals)).toBe('add')
  })

  it('returns "remove" for mixed deletes and modifications', () => {
    const signals = makeSignals({
      files: files('D', 'M'),
      stats: stats(5, 40),
    })
    expect(selectCommitVerb(signals)).toBe('remove')
  })

  it('returns "update" for plain modifications with no strong signals', () => {
    const signals = makeSignals({
      files: files('M'),
      stats: stats(35, 20),
    })
    expect(selectCommitVerb(signals)).toBe('update')
  })

  it('returns "add" for a copied file (C status)', () => {
    const signals = makeSignals({
      files: files('C'),
      stats: stats(20, 0),
    })
    expect(selectCommitVerb(signals)).toBe('add')
  })
})
