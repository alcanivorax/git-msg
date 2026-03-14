// src/analysis/scope.ts

import type { StagedFile } from '../git/staged.js'

/**
 * Generic directory names that carry no domain context and should be
 * skipped when walking a path to find a meaningful scope segment.
 */
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
 * Returns the primary domain/module name derived from staged file paths,
 * used as the conventional commit scope — the part in parentheses:
 *   feat(auth): add login flow
 *
 * Returns null when no clear single scope can be identified, e.g. when
 * changes span multiple unrelated directories.
 *
 * A scope is only returned when ≥ 60% of files share the same meaningful
 * directory segment.
 */
export function detectScope(files: StagedFile[]): string | null {
  if (files.length === 0) return null

  const segments = files
    .map((f) => extractMeaningfulSegment(f.path))
    .filter((s): s is string => s !== null)

  if (segments.length === 0) return null

  const counts = countOccurrences(segments)
  const [top, freq] = mostCommon(counts)

  if (top !== null && freq / segments.length >= 0.6) return top

  return null
}

/**
 * Walks path segments left-to-right (excluding the filename at the end)
 * and returns the first segment that is not generic or hidden.
 *
 * Examples:
 *   src/auth/login.ts        → "auth"
 *   src/lib/utils/format.ts  → "lib" is generic, "utils" is generic → null
 *   .github/workflows/ci.yml → starts with "." → skip → null
 *   auth/middleware.ts       → "auth"
 */
function extractMeaningfulSegment(filePath: string): string | null {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)

  // The last part is the filename — we only look at directory segments
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i].toLowerCase()
    if (part.startsWith('.')) continue
    if (GENERIC_DIRS.has(part)) continue
    return part
  }

  return null
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
