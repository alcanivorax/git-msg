// src/analysis/diff.ts

/**
 * Parses the raw `git diff --cached` output and extracts high-signal
 * information that guides commit message generation — without performing
 * any semantic interpretation of what the code actually does.
 */

export type DiffSignals = {
  /** Top-level symbol names found on added lines (functions, classes, types). */
  addedSymbols: string[]
  /** Top-level symbol names found on removed lines. */
  removedSymbols: string[]
  /** True when added lines contain fix/error/bug-related keywords. */
  hasFixPattern: boolean
  /** True when added lines contain test framework keywords. */
  hasTestPattern: boolean
  /** Net line delta: insertions minus deletions. */
  netLines: number
  /** External package names newly imported (non-relative). */
  addedPackages: string[]
}

/**
 * Matches top-level declarations across TS/JS, Python, Go, and Rust.
 * Each pattern captures the symbol name in group 1.
 */
const SYMBOL_PATTERNS: RegExp[] = [
  // TS/JS: exported or bare (async) function
  /^[+-]\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/,
  // TS/JS: const arrow function assigned at top level
  /^[+-]\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/,
  // TS/JS: class (including abstract)
  /^[+-]\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
  // TS/JS: interface / type alias / enum
  /^[+-]\s*(?:export\s+)?(?:interface|type|enum)\s+(\w+)/,
  // Python: def / async def
  /^[+-]\s*(?:async\s+)?def\s+(\w+)/,
  // Python: class
  /^[+-]\s*class\s+(\w+)\s*[:(]/,
  // Go: func (including methods with receivers)
  /^[+-]\s*func\s+(?:\(\w[\w\s*]*\)\s+)?(\w+)/,
  // Rust: fn (including pub, async, pub async)
  /^[+-]\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/,
  // Rust: struct
  /^[+-]\s*(?:pub\s+)?struct\s+(\w+)/,
]

const FIX_PATTERN =
  /\b(fix|bug|error|issue|resolve|correct|broken|missing|invalid|fail|patch|regression|typo|crash|leak|deadlock|workaround|fallback|oops|revert)\b/i

const TEST_PATTERN =
  /\b(describe\s*\(|it\s*\(|test\s*\(|expect\s*\(|beforeEach|afterEach|beforeAll|afterAll|assert\.)/

/** Matches new non-relative package imports (i.e. actual package names, not local files). */
const ADDED_ES_IMPORT_PATTERN =
  /^[+]\s*import\s+.*\s+from\s+['"]([^'"./][^'"]*)['"]/

const ADDED_REQUIRE_PATTERN = /^[+].*\brequire\s*\(\s*['"]([^'"./][^'"]*)['"]/

export function analyzeDiff(diff: string): DiffSignals {
  if (!diff) return emptySignals()

  const addedSymbols: string[] = []
  const removedSymbols: string[] = []
  const addedPackages: string[] = []

  let hasFixPattern = false
  let hasTestPattern = false
  let netLines = 0

  for (const line of diff.split('\n')) {
    // Skip diff metadata lines — they are not content
    if (
      line.startsWith('+++') ||
      line.startsWith('---') ||
      line.startsWith('@@') ||
      line.startsWith('diff ') ||
      line.startsWith('index ')
    )
      continue

    const isAdded = line.startsWith('+')
    const isRemoved = line.startsWith('-')
    if (!isAdded && !isRemoved) continue

    if (isAdded) netLines++
    if (isRemoved) netLines--

    // Symbol extraction — stop at the first matching pattern per line
    for (const pattern of SYMBOL_PATTERNS) {
      const match = line.match(pattern)
      if (match?.[1]) {
        if (isAdded) addedSymbols.push(match[1])
        else removedSymbols.push(match[1])
        break
      }
    }

    if (isAdded) {
      // Fix-pattern detection (only care about lines that were intentionally added)
      if (!hasFixPattern) hasFixPattern = FIX_PATTERN.test(line)

      // New external package import detection (ES import or require())
      const esImport = line.match(ADDED_ES_IMPORT_PATTERN)
      const cjsImport = line.match(ADDED_REQUIRE_PATTERN)
      const pkgName = esImport?.[1] ?? cjsImport?.[1]
      if (pkgName) addedPackages.push(pkgName)
    }

    // Test-pattern detection on any changed line
    if (!hasTestPattern) hasTestPattern = TEST_PATTERN.test(line)
  }

  return {
    addedSymbols: dedupe(addedSymbols),
    removedSymbols: dedupe(removedSymbols),
    hasFixPattern,
    hasTestPattern,
    netLines,
    addedPackages: dedupe(addedPackages),
  }
}

function emptySignals(): DiffSignals {
  return {
    addedSymbols: [],
    removedSymbols: [],
    hasFixPattern: false,
    hasTestPattern: false,
    netLines: 0,
    addedPackages: [],
  }
}

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}
