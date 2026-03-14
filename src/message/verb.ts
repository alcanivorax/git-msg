// src/message/verb.ts

import type { CommitSignals } from '../analysis/signals.js'

/**
 * Verb prefixes commonly found at the start of function/method names.
 * When a primary added symbol starts with one of these, the prefix
 * itself becomes a strong candidate for the commit verb.
 *
 * Ordered roughly by how unambiguous they are as commit verbs.
 */
const SYMBOL_VERB_PREFIXES = [
  'migrate',
  'configure',
  'setup',
  'bootstrap',
  'initialize',
  'init',
  'implement',
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
] as const

/**
 * Selects the imperative verb that describes what this commit does.
 *
 * Decision order (first match wins):
 *   1. Pure rename / pure delete  (structural file operations)
 *   2. Revert keyword in diff
 *   3. Fix/error pattern in diff
 *   4. Primary added symbol carries a strong verb prefix
 *   5. Status + magnitude heuristics for modification-only changes
 *   6. Catch-all based on which statuses are present
 */
export function selectCommitVerb(signals: CommitSignals): string {
  const { files, stats, diff } = signals
  const statuses = new Set(files.map((f) => f.status))

  // ── 1. Structural file operations ────────────────────────────────────────
  const onlyRenames = files.every((f) => f.status === 'R')
  const onlyDeletes = files.every((f) => f.status === 'D')

  if (onlyRenames) return 'rename'
  if (onlyDeletes) return 'remove'

  // ── 2. Explicit revert ───────────────────────────────────────────────────
  if (diff.addedSymbols.some((s) => s.toLowerCase().startsWith('revert'))) {
    return 'revert'
  }

  // ── 3. Fix / error patterns in the diff ──────────────────────────────────
  if (diff.hasFixPattern) {
    // Small targeted fix vs. larger error-handling work
    const totalChanges = stats.insertions + stats.deletions
    return totalChanges <= 15 ? 'fix' : 'handle'
  }

  // ── 4. Symbol-based verb from the primary added declaration ──────────────
  const primarySymbol = diff.addedSymbols[0]
  if (primarySymbol) {
    const symbolVerb = extractVerbPrefix(primarySymbol)
    if (symbolVerb) return symbolVerb
  }

  // ── 5. Modification-only heuristics (size-based) ─────────────────────────
  const onlyModified = statuses.size === 1 && statuses.has('M')
  const totalChanges = stats.insertions + stats.deletions

  if (onlyModified) {
    if (totalChanges <= 5) return 'fix' // tiny tweak — likely a fix
    if (totalChanges <= 30) return 'refactor' // contained rework
    if (totalChanges <= 80) return 'update' // medium update
    return 'refactor' // large reshaping
  }

  // ── 6. Catch-all based on present statuses ───────────────────────────────
  if ((statuses.has('A') || statuses.has('C')) && !statuses.has('D'))
    return 'add'

  // D+M: only call it "remove" when deletions heavily outweigh insertions,
  // meaning the primary intent is removal, not a general mixed edit.
  if (statuses.has('D') && statuses.has('M')) {
    const dominantDeletion = stats.deletions > stats.insertions * 4
    return dominantDeletion ? 'remove' : 'update'
  }

  if (statuses.has('M')) return 'update'

  return 'update'
}

/**
 * Tries to extract a meaningful imperative verb from the start of a
 * symbol name (camelCase or PascalCase).
 *
 * Returns null when no known verb prefix is found so the caller can
 * fall through to the next heuristic.
 *
 * Examples:
 *   validateUserEmail  → "validate"
 *   setupDatabase      → "setup"
 *   migrateUserTable   → "migrate"
 *   UserAuthService    → null  (no verb prefix)
 */
function extractVerbPrefix(symbolName: string): string | null {
  // Normalise to lowercase for comparison while preserving split points
  const lower = symbolName.toLowerCase()

  for (const verb of SYMBOL_VERB_PREFIXES) {
    if (lower.startsWith(verb)) {
      // Make sure it's a real prefix boundary — the next char should be
      // uppercase (camelCase) or the symbol ends right there
      const nextChar = symbolName[verb.length]
      if (nextChar === undefined || nextChar === nextChar.toUpperCase()) {
        return verb
      }
    }
  }

  return null
}
