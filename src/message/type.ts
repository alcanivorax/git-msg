// src/message/type.ts

import type { CommitSignals } from '../analysis/signals.js'
import type { ChangeCategory } from '../analysis/categories.js'

const CATEGORY_TO_TYPE: Record<ChangeCategory, string> = {
  code: 'feat',
  tests: 'test',
  docs: 'docs',
  config: 'chore',
  ci: 'ci',
  build: 'build',
  styles: 'style',
  chore: 'chore',
}

/**
 * Selects the conventional commit type from the aggregated signals.
 *
 * The base mapping is category → type, but several override rules are
 * evaluated first to produce a more accurate result:
 *
 *   - Fix/error keywords in the diff        → `fix`  (beats `feat`)
 *   - Test patterns in the diff             → `test` (beats `feat`)
 *   - Every file deleted or renamed         → `refactor`
 *   - Mixed adds + deletes (net negative)   → `refactor`
 */
export function selectCommitType(signals: CommitSignals): string {
  const { category, diff, files, stats } = signals
  const statuses = new Set(files.map((f) => f.status))

  if (category === 'code') {
    // Explicit fix/error signals beat a generic feat classification
    if (diff.hasFixPattern) return 'fix'

    // Test framework keywords detected in the diff
    if (diff.hasTestPattern) return 'test'

    // Pure structural cleanup — nothing new was added
    const allDeletedOrRenamed = files.every(
      (f) => f.status === 'D' || f.status === 'R'
    )
    if (allDeletedOrRenamed) return 'refactor'

    // Large net-negative change (more removed than added) with no new files
    const netNegative = stats.deletions > stats.insertions * 1.5
    const noNewFiles = !statuses.has('A')
    if (netNegative && noNewFiles) return 'refactor'
  }

  return CATEGORY_TO_TYPE[category] ?? 'chore'
}
