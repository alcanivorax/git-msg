import { describe, it, expect } from 'vitest'
import { selectCommitObject } from '../object.js'
import type { CommitSignals } from '../../analysis/signals.js'
import type { StagedFile } from '../../git/staged.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSignals(overrides: Partial<CommitSignals> = {}): CommitSignals {
  return {
    files: [],
    stats: { files: 1, insertions: 10, deletions: 0 },
    diff: {
      addedSymbols: [],
      removedSymbols: [],
      hasFixPattern: false,
      hasTestPattern: false,
      netLines: 10,
      addedPackages: [],
    },
    category: 'code',
    scope: null,
    ...overrides,
  }
}

function file(path: string, status: StagedFile['status'] = 'M'): StagedFile {
  return { path, status }
}

function withSymbols(
  added: string[],
  removed: string[] = []
): CommitSignals['diff'] {
  return {
    addedSymbols: added,
    removedSymbols: removed,
    hasFixPattern: false,
    hasTestPattern: false,
    netLines: added.length - removed.length,
    addedPackages: [],
  }
}

function noSymbols(): CommitSignals['diff'] {
  return withSymbols([])
}

// ---------------------------------------------------------------------------
// 1. Symbol-based object — verb prefix stripping
// ---------------------------------------------------------------------------

describe('selectCommitObject — symbol verb prefix stripping', () => {
  it('strips "validate" and returns the remaining words', () => {
    const signals = makeSignals({ diff: withSymbols(['validateUserEmail']) })
    expect(selectCommitObject(signals)).toBe('user email')
  })

  it('strips "parse" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['parseConfigFile']) })
    expect(selectCommitObject(signals)).toBe('config file')
  })

  it('strips "handle" from a symbol', () => {
    const signals = makeSignals({
      diff: withSymbols(['handleDatabaseConnection']),
    })
    expect(selectCommitObject(signals)).toBe('database connection')
  })

  it('strips "fetch" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['fetchUserProfile']) })
    expect(selectCommitObject(signals)).toBe('user profile')
  })

  it('strips "create" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['createUserRecord']) })
    expect(selectCommitObject(signals)).toBe('user record')
  })

  it('strips "build" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['buildOutputBundle']) })
    expect(selectCommitObject(signals)).toBe('output bundle')
  })

  it('strips "setup" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['setupDatabase']) })
    expect(selectCommitObject(signals)).toBe('database')
  })

  it('strips "initialize" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['initializeLogger']) })
    expect(selectCommitObject(signals)).toBe('logger')
  })

  it('strips "init" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['initRedisClient']) })
    expect(selectCommitObject(signals)).toBe('redis client')
  })

  it('strips "migrate" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['migrateUserTable']) })
    expect(selectCommitObject(signals)).toBe('user table')
  })

  it('strips "configure" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['configureMiddleware']) })
    expect(selectCommitObject(signals)).toBe('middleware')
  })

  it('strips "generate" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['generateAuthToken']) })
    expect(selectCommitObject(signals)).toBe('auth token')
  })

  it('strips "transform" from a symbol', () => {
    const signals = makeSignals({
      diff: withSymbols(['transformResponsePayload']),
    })
    expect(selectCommitObject(signals)).toBe('response payload')
  })

  it('strips "extract" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['extractTokenClaims']) })
    expect(selectCommitObject(signals)).toBe('token claims')
  })

  it('strips "process" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['processQueueMessage']) })
    expect(selectCommitObject(signals)).toBe('queue message')
  })

  it('strips "register" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['registerApiRoutes']) })
    expect(selectCommitObject(signals)).toBe('api routes')
  })

  it('strips "load" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['loadUserSettings']) })
    expect(selectCommitObject(signals)).toBe('user settings')
  })

  it('strips "resolve" from a symbol', () => {
    const signals = makeSignals({
      diff: withSymbols(['resolveDependencyGraph']),
    })
    expect(selectCommitObject(signals)).toBe('dependency graph')
  })

  it('strips "dispatch" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['dispatchAuthAction']) })
    expect(selectCommitObject(signals)).toBe('auth action')
  })

  it('strips "subscribe" from a symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['subscribeToEvents']) })
    expect(selectCommitObject(signals)).toBe('to events')
  })
})

// ---------------------------------------------------------------------------
// 2. Symbol-based object — no verb prefix (PascalCase classes / types)
// ---------------------------------------------------------------------------

describe('selectCommitObject — symbols with no verb prefix', () => {
  it('humanizes a PascalCase class name', () => {
    const signals = makeSignals({ diff: withSymbols(['UserAuthService']) })
    expect(selectCommitObject(signals)).toBe('user auth service')
  })

  it('humanizes a two-word class name', () => {
    const signals = makeSignals({ diff: withSymbols(['DatabaseConnection']) })
    expect(selectCommitObject(signals)).toBe('database connection')
  })

  it('humanizes an interface name', () => {
    const signals = makeSignals({ diff: withSymbols(['CommitSignals']) })
    expect(selectCommitObject(signals)).toBe('commit signals')
  })

  it('humanizes a type alias name', () => {
    const signals = makeSignals({ diff: withSymbols(['FileStatus']) })
    expect(selectCommitObject(signals)).toBe('file status')
  })

  it('returns a lowercased single-word non-generic symbol', () => {
    const signals = makeSignals({ diff: withSymbols(['Router']) })
    expect(selectCommitObject(signals)).toBe('router')
  })

  it('caps the result at 4 words for very long symbol names', () => {
    // "createVeryLongAndVerboseSymbolName" → strip "create" → up to 4 words
    const signals = makeSignals({
      diff: withSymbols(['createVeryLongAndVerboseSymbolName']),
    })
    const result = selectCommitObject(signals)
    expect(result.split(' ').length).toBeLessThanOrEqual(4)
  })
})

// ---------------------------------------------------------------------------
// 3. Symbol-based object — generic fallthrough cases
// ---------------------------------------------------------------------------

describe('selectCommitObject — generic symbol fallthrough', () => {
  const genericSymbolCases = [
    'handleError',
    'handleData',
    'handleResult',
    'handleResponse',
    'handleRequest',
    'handleEvent',
    'handleCallback',
    'handlePayload',
  ]

  for (const symbol of genericSymbolCases) {
    it(`falls through for generic symbol "${symbol}"`, () => {
      // The symbol strips to a single generic word; must not return that generic word
      const signals = makeSignals({
        files: [file('src/auth/service.ts', 'M')],
        diff: withSymbols([symbol]),
      })
      const result = selectCommitObject(signals)
      // Should fall through to path-based → "auth module"
      expect(result).toBe('auth module')
    })
  }

  it('falls through when "init" strips to nothing (verb only, no remaining words)', () => {
    const signals = makeSignals({
      files: [file('src/auth/setup.ts', 'M')],
      diff: withSymbols(['init']),
    })
    // "init" is a pure verb with nothing remaining → falls through to path
    expect(selectCommitObject(signals)).toBe('auth module')
  })

  it('falls through when "validate" strips to a single generic word', () => {
    const signals = makeSignals({
      files: [file('src/api/middleware.ts', 'M')],
      diff: withSymbols(['validateData']),
    })
    // "validateData" → strips "validate" → "data" → generic → falls through
    expect(selectCommitObject(signals)).toBe('api')
  })
})

// ---------------------------------------------------------------------------
// 4. Symbol-based object — removed symbols (deletions)
// ---------------------------------------------------------------------------

describe('selectCommitObject — removed symbols fallback', () => {
  it('uses the primary removed symbol when no symbols were added', () => {
    const signals = makeSignals({
      diff: withSymbols([], ['LegacyPaymentModule']),
    })
    expect(selectCommitObject(signals)).toBe('legacy payment module')
  })

  it('prefers an added symbol over a removed one', () => {
    const signals = makeSignals({
      diff: withSymbols(['NewAuthService'], ['OldAuthHandler']),
    })
    // "New" is not a verb prefix — all three words are kept
    expect(selectCommitObject(signals)).toBe('new auth service')
  })
})

// ---------------------------------------------------------------------------
// 5. Path-based object — domain suffix application
// ---------------------------------------------------------------------------

describe('selectCommitObject — path-based domain suffix', () => {
  it('appends "module" to an unknown domain', () => {
    const signals = makeSignals({
      files: [file('src/auth/login.ts'), file('src/auth/logout.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('auth module')
  })

  it('appends "pipeline" to a "ci" domain', () => {
    const signals = makeSignals({
      files: [
        file('.github/workflows/deploy.yml'),
        file('.github/workflows/test.yml'),
      ],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('workflows pipeline')
  })

  it('uses the first non-generic domain when "tests" is nested under a feature module', () => {
    const signals = makeSignals({
      files: [
        file('src/auth/tests/login.test.ts'),
        file('src/auth/tests/logout.test.ts'),
      ],
      diff: noSymbols(),
    })
    // extractMeaningfulDir walks left-to-right; "src" is generic, "auth" is not → "auth module"
    expect(selectCommitObject(signals)).toBe('auth module')
  })

  it('appends "components" to a "components" domain', () => {
    const signals = makeSignals({
      files: [
        file('src/components/Button.tsx'),
        file('src/components/Input.tsx'),
      ],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('components')
  })

  it('appends "hooks" to a "hooks" domain', () => {
    const signals = makeSignals({
      files: [file('src/hooks/useAuth.ts'), file('src/hooks/useUser.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('hooks')
  })

  it('appends "styles" to a "styles" domain', () => {
    const signals = makeSignals({
      files: [file('src/styles/main.css'), file('src/styles/theme.css')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('styles')
  })

  it('appends "config" to a "config" domain', () => {
    const signals = makeSignals({
      files: [file('src/config/db.ts'), file('src/config/redis.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('config')
  })

  it('returns "api" standalone (null suffix — self-describing)', () => {
    const signals = makeSignals({
      files: [file('src/api/users.ts'), file('src/api/posts.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('api')
  })

  it('returns "cli" standalone (null suffix — self-describing)', () => {
    const signals = makeSignals({
      files: [file('src/cli/args.ts'), file('src/cli/flags.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('cli')
  })

  it('returns "middleware" standalone (null suffix — self-describing)', () => {
    const signals = makeSignals({
      files: [file('src/middleware/auth.ts'), file('src/middleware/cors.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('middleware')
  })

  it('appends "types" to a "types" domain', () => {
    const signals = makeSignals({
      files: [file('src/types/user.ts'), file('src/types/post.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('types')
  })

  it('appends "schemas" to a "schemas" domain', () => {
    const signals = makeSignals({
      files: [file('src/schemas/user.ts'), file('src/schemas/post.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('schemas')
  })
})

// ---------------------------------------------------------------------------
// 6. Path-based object — domain majority threshold (≥ 50%)
// ---------------------------------------------------------------------------

describe('selectCommitObject — domain majority threshold', () => {
  it('uses the top domain when it has 100% of files', () => {
    const signals = makeSignals({
      files: [file('src/auth/a.ts'), file('src/auth/b.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('auth module')
  })

  it('uses the top domain when it has exactly 50% of files', () => {
    const signals = makeSignals({
      files: [file('src/auth/a.ts'), file('src/api/b.ts')],
      diff: noSymbols(),
    })
    // "auth" appears first and ties at 50% — mostCommon returns the first encountered
    const result = selectCommitObject(signals)
    expect(['auth module', 'api']).toContain(result)
  })

  it('falls through to "project" when no single domain is dominant (< 50%)', () => {
    const signals = makeSignals({
      files: [file('src/auth/a.ts'), file('src/api/b.ts'), file('src/ui/c.ts')],
      diff: noSymbols(),
    })
    // Each domain has 1/3 ≈ 33% — below the 50% threshold
    expect(selectCommitObject(signals)).toBe('project')
  })

  it('uses the majority domain when one module dominates a mixed set', () => {
    const signals = makeSignals({
      files: [
        file('src/auth/a.ts'),
        file('src/auth/b.ts'),
        file('src/auth/c.ts'),
        file('src/api/d.ts'),
      ],
      diff: noSymbols(),
    })
    // "auth" has 3/4 = 75% — above 50%
    expect(selectCommitObject(signals)).toBe('auth module')
  })

  it('skips generic directory names when finding the domain', () => {
    const signals = makeSignals({
      files: [
        file('src/payments/invoice.ts'),
        file('src/payments/checkout.ts'),
      ],
      diff: noSymbols(),
    })
    // "src" is generic and skipped — "payments" is the domain
    expect(selectCommitObject(signals)).toBe('payments module')
  })
})

// ---------------------------------------------------------------------------
// 7. Filename fallback (single file, no symbol, no domain)
// ---------------------------------------------------------------------------

describe('selectCommitObject — filename fallback', () => {
  it('humanizes a PascalCase filename', () => {
    const signals = makeSignals({
      files: [file('LoginService.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('login service')
  })

  it('humanizes a camelCase filename', () => {
    const signals = makeSignals({
      files: [file('userProfile.ts')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('user profile')
  })

  it('humanizes a kebab-case filename', () => {
    const signals = makeSignals({
      files: [file('migrate-database.sh')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('migrate database')
  })

  it('humanizes a snake_case filename', () => {
    const signals = makeSignals({
      files: [file('user_auth_service.py')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('user auth service')
  })

  it('strips the file extension', () => {
    const signals = makeSignals({
      files: [file('README.md')],
      diff: noSymbols(),
    })
    expect(selectCommitObject(signals)).toBe('readme')
  })

  it('uses the filename even when deeply nested (but domain is empty)', () => {
    const signals = makeSignals({
      files: [file('src/utils/formatDate.ts')],
      diff: noSymbols(),
    })
    // "src" and "utils" are both generic → no domain → filename fallback
    expect(selectCommitObject(signals)).toBe('format date')
  })

  it('does NOT use filename fallback when a domain is available', () => {
    const signals = makeSignals({
      files: [file('src/auth/LoginService.ts')],
      diff: noSymbols(),
    })
    // "auth" is a valid domain → domain wins over filename
    expect(selectCommitObject(signals)).toBe('auth module')
  })
})

// ---------------------------------------------------------------------------
// 8. Generic fallback — "project"
// ---------------------------------------------------------------------------

describe('selectCommitObject — generic fallback', () => {
  it('returns "project" when there are no files at all', () => {
    const signals = makeSignals({ files: [], diff: noSymbols() })
    expect(selectCommitObject(signals)).toBe('project')
  })

  it('returns "project" when files span many unrelated domains', () => {
    const signals = makeSignals({
      files: [
        file('src/auth/login.ts'),
        file('src/api/routes.ts'),
        file('src/ui/button.tsx'),
        file('src/db/schema.ts'),
        file('src/queue/worker.ts'),
      ],
      diff: noSymbols(),
    })
    // Each domain has 20% — well below the 50% threshold
    expect(selectCommitObject(signals)).toBe('project')
  })

  it('returns "project" when all files live in generic directories only', () => {
    const signals = makeSignals({
      files: [
        file('src/utils/a.ts'),
        file('src/helpers/b.ts'),
        file('src/common/c.ts'),
      ],
      diff: noSymbols(),
    })
    // All dirs are generic → no meaningful domain → fallback
    expect(selectCommitObject(signals)).toBe('project')
  })
})
