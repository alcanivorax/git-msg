import type { FileStatus, StagedStats } from '../../git/files.js'

/*
    ===============================================
    ================ Qualifier ====================
    ===============================================
*/

export function detectCommitQualifier(
  stagedFiles: FileStatus[],
  stats: StagedStats
): string | null {
  const paths = stagedFiles.map((f) => f.path.replace(/\\/g, '/').toLowerCase())

  // Environment-related files (broad)
  if (paths.some((p) => p.includes('.env'))) {
    return 'for environment'
  }

  // Large, cross-cutting change
  if (stats.files >= 10) {
    return 'project-wide'
  }

  return null
}
