// src/analysis/signals.ts

import type { StagedFile, StagedStats } from '../git/staged.js'
import type { DiffSignals } from './diff.js'
import type { ChangeCategory } from './categories.js'
import { classifyFiles } from './categories.js'
import { detectScope } from './scope.js'

export type CommitSignals = {
  files: StagedFile[]
  stats: StagedStats
  diff: DiffSignals
  category: ChangeCategory
  scope: string | null
}

/**
 * Aggregates all available signals about the staged changeset into a single
 * object that is passed through the entire message-building pipeline.
 *
 * Keeping all signals in one place means each message module (type, verb,
 * object, builder) can make decisions based on the full picture rather than
 * a narrow slice of the data.
 */
export function gatherSignals(
  files: StagedFile[],
  stats: StagedStats,
  diff: DiffSignals
): CommitSignals {
  return {
    files,
    stats,
    diff,
    category: classifyFiles(files),
    scope: detectScope(files),
  }
}
