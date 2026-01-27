import type { FileStatus, StagedStats } from '../../git/files.js'

/*
    ===============================================
    =================== Verb ======================
    ===============================================
*/

export function detectCommitVerb(
  stagedFiles: FileStatus[],
  stats: StagedStats
): string {
  const statuses = new Set(stagedFiles.map((f) => f.status))
  const totalChanges = stats.insertions + stats.deletions

  // Highest-signal structural actions
  if (statuses.has('R')) return 'rename'
  if (statuses.has('A')) return 'add'
  if (statuses.has('D')) return 'remove'
  if (statuses.has('C')) return 'add'

  const onlyModified = statuses.size === 1 && statuses.has('M')

  // Very small, isolated change -> fix
  if (onlyModified && totalChanges > 0 && totalChanges <= 5) return 'fix'

  // Medium structural change, no lifecycle change -> refactor
  if (onlyModified && totalChanges > 5 && totalChanges <= 50) return 'refactor'

  // Everything else that modifies files
  if (statuses.has('M')) return 'update'

  return 'handle'
}
//  const status = rawStatus[0] // handles R100, C75, etc.
