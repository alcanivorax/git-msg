// src/message/object.ts

import type { CommitSignals } from '../analysis/signals.js'

/**
 * Verb prefixes that are stripped from the start of a symbol name
 * when deriving the commit object — so the object describes *what*
 * was affected, not *what was done to it* (that's the verb's job).
 *
 * "validateUserEmail"  → strip "validate" → "user email"
 * "parseConfigFile"    → strip "parse"    → "config file"
 * "handleDatabaseConn" → strip "handle"   → "database conn"
 */
const SYMBOL_VERB_PREFIXES: string[] = [
  'validate',
  'parse',
  'generate',
  'transform',
  'extract',
  'process',
  'register',
  'handle',
  'fetch',
  'load',
  'create',
  'build',
  'configure',
  'setup',
  'bootstrap',
  'initialize',
  'init',
  'implement',
  'migrate',
  'get',
  'set',
  'update',
  'delete',
  'remove',
  'add',
  'check',
  'send',
  'receive',
  'start',
  'stop',
  'run',
  'execute',
  'render',
  'format',
  'convert',
  'merge',
  'split',
  'filter',
  'read',
  'write',
  'open',
  'close',
  'connect',
  'disconnect',
  'enable',
  'disable',
  'toggle',
  'reset',
  'refresh',
  'resolve',
  'reject',
  'emit',
  'dispatch',
  'subscribe',
  'unsubscribe',
]

/**
 * Maps known directory names to a human-readable suffix.
 * A null value means the name stands alone with no suffix.
 */
const DOMAIN_SUFFIX_MAP: Record<string, string | null> = {
  // CI / CD
  ci: 'pipeline',
  workflows: 'pipeline',
  actions: 'pipeline',

  // Testing
  test: 'tests',
  tests: 'tests',
  __tests__: 'tests',
  spec: 'tests',
  e2e: 'tests',
  integration: 'tests',

  // UI / Frontend
  components: 'components',
  component: 'components',
  ui: 'components',
  views: 'components',
  pages: 'components',
  layouts: 'components',
  hooks: 'hooks',
  styles: 'styles',
  css: 'styles',
  scss: 'styles',

  // Types / Schemas
  types: 'types',
  interfaces: 'types',
  models: 'types',
  schemas: 'schemas',
  validators: 'schemas',

  // Config / Scripts
  config: 'config',
  configs: 'config',
  settings: 'config',
  scripts: 'scripts',

  // Standalone — no suffix needed
  api: null,
  cli: null,
  docs: null,
  doc: null,
  middleware: null,
}

/** Generic directory names that carry no meaningful domain context. */
const GENERIC_DIRS = new Set([
  'src',
  'lib',
  'app',
  'apps',
  'packages',
  'pkg',
  'core',
  'internal',
  'utils',
  'helpers',
  'common',
  'shared',
  'main',
  'index',
  'dist',
  'build',
  'out',
])

/**
 * Single-word results that are too vague to be useful commit objects.
 * When a stripped symbol collapses to one of these, we fall through to
 * the next heuristic rather than surfacing a meaningless word.
 */
const GENERIC_WORDS = new Set([
  'error',
  'data',
  'result',
  'value',
  'item',
  'object',
  'response',
  'request',
  'event',
  'callback',
  'handler',
  'helper',
  'util',
  'info',
  'payload',
])

/**
 * Derives a specific, human-readable commit object from the available signals.
 *
 * Decision order (first that produces a non-null, non-generic result wins):
 *   1. Primary added symbol — humanized and verb-stripped
 *   2. Most common meaningful directory — with domain suffix applied
 *   3. Humanized filename — for single-file changes
 *   4. Generic fallback: "project"
 */
export function selectCommitObject(signals: CommitSignals): string {
  const { diff, files } = signals

  // ── 1. Symbol-based object ───────────────────────────────────────────────
  // Prefer added symbols; fall back to removed symbols (e.g. pure deletes)
  const primarySymbol = diff.addedSymbols[0] ?? diff.removedSymbols[0]
  if (primarySymbol) {
    const symbolObject = symbolToObject(primarySymbol)
    if (symbolObject) return symbolObject
  }

  // ── 2. Path-based object ─────────────────────────────────────────────────
  const paths = files.map((f) => f.path.replace(/\\/g, '/'))
  const domains = paths
    .map(extractMeaningfulDir)
    .filter((d): d is string => d !== null)

  if (domains.length > 0) {
    const counts = countOccurrences(domains)
    const [topDomain, freq] = mostCommon(counts)

    // Use the top domain when it represents ≥ 50% of files
    if (topDomain !== null && freq / domains.length >= 0.5) {
      return applyDomainSuffix(topDomain)
    }
  }

  // ── 3. Filename fallback (single-file changes) ───────────────────────────
  if (files.length === 1) {
    return humanizeFilename(files[0].path)
  }

  // ── 4. Generic fallback ──────────────────────────────────────────────────
  return 'project'
}

/**
 * Converts a symbol name (camelCase or PascalCase) into a commit object string.
 *
 * Steps:
 *   1. Split into words on camelCase / PascalCase boundaries
 *   2. Strip a leading verb prefix, if present
 *   3. Discard the result if it collapses to a single generic word
 *   4. Cap at 4 words and return lowercased
 *
 * Returns null when the result would be too short or generic to be useful,
 * so the caller can fall through to the next heuristic.
 *
 * Examples:
 *   validateUserEmail        → "user email"
 *   UserAuthService          → "user auth service"
 *   parseConfigFile          → "config file"
 *   handleDatabaseConnection → "database connection"
 *   handleError              → null   (single generic word)
 *   init                     → null   (verb only, nothing left)
 */
function symbolToObject(symbolName: string): string | null {
  const words = splitCamelCase(symbolName)
  if (words.length === 0) return null

  // Strip a leading verb if the first word is a known verb prefix
  const firstWord = words[0].toLowerCase()
  const hasVerb = SYMBOL_VERB_PREFIXES.includes(firstWord)
  const remaining = hasVerb ? words.slice(1) : words

  if (remaining.length === 0) return null

  const joined = remaining.join(' ').toLowerCase()

  // Reject single-word results that are too generic to be informative
  if (remaining.length === 1 && GENERIC_WORDS.has(joined)) return null

  // Cap at 4 words to keep the commit subject concise
  return remaining.slice(0, 4).join(' ').toLowerCase()
}

/**
 * Splits a camelCase or PascalCase identifier into individual words.
 *
 * Examples:
 *   validateUserEmail → ["validate", "User", "Email"]
 *   UserAuthService   → ["User", "Auth", "Service"]
 *   HTMLParser        → ["HTML", "Parser"]
 *   parseHTMLContent  → ["parse", "HTML", "Content"]
 */
function splitCamelCase(name: string): string[] {
  return (
    name
      // "parseHTML"    → "parse HTML"  (lowercase → uppercase boundary)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // "HTMLParser"   → "HTML Parser" (run of caps followed by cap+lower)
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[\s_-]+/)
      .filter(Boolean)
  )
}

/**
 * Applies a human-readable suffix to a domain directory name.
 *
 * Examples:
 *   "auth"       → "auth module"      (default suffix)
 *   "ci"         → "ci pipeline"      (mapped suffix)
 *   "api"        → "api"              (null = standalone)
 *   "components" → "components"       (name already ends with suffix)
 */
function applyDomainSuffix(domain: string): string {
  const key = domain.toLowerCase()

  // Look up the suffix; default to "module" for unknown domains
  const suffix = Object.prototype.hasOwnProperty.call(DOMAIN_SUFFIX_MAP, key)
    ? DOMAIN_SUFFIX_MAP[key]
    : 'module'

  // null means the name is self-describing
  if (suffix === null) return domain

  // Avoid "components components", "tests tests", etc.
  if (domain.endsWith(suffix)) return domain

  return `${domain} ${suffix}`
}

/**
 * Walks path segments left-to-right (excluding the filename at the end)
 * and returns the first segment that is not generic or hidden.
 *
 * Examples:
 *   src/auth/login.ts        → "auth"
 *   src/utils/format.ts      → null   (both segments are generic)
 *   .github/workflows/ci.yml → null   (hidden dir)
 */
function extractMeaningfulDir(filePath: string): string | null {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i].toLowerCase()
    if (part.startsWith('.')) continue
    if (GENERIC_DIRS.has(part)) continue
    return part
  }

  return null
}

/**
 * Converts a file path into a readable commit object by stripping the
 * extension and humanizing the filename.
 *
 * Examples:
 *   src/auth/LoginService.ts  → "login service"
 *   scripts/migrate-db.sh     → "migrate db"
 *   README.md                 → "readme"
 */
function humanizeFilename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const file = normalized.split('/').pop() ?? normalized
  const name = file.replace(/\.[^/.]+$/, '') // strip extension

  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → words
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // HTMLParser → HTML Parser
    .replace(/[-_.]/g, ' ') // kebab / snake / dot → space
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function countOccurrences<T>(items: T[]): Map<T, number> {
  const map = new Map<T, number>()
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1)
  }
  return map
}

function mostCommon<T>(counts: Map<T, number>): [T | null, number] {
  let topKey: T | null = null
  let topVal = 0

  for (const [key, val] of counts) {
    if (val > topVal) {
      topKey = key
      topVal = val
    }
  }

  return [topKey, topVal]
}
