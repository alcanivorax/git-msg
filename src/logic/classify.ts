// src/analyze/classify.ts

import { FileStatus } from '../git/files.js'

export function detectChangeType(stagedFiles: FileStatus[]): string {
  const hasCode = stagedFiles.map((f) => {
    f.path.startsWith('src/') &&
      (f.path.endsWith('.ts') || f.path.endsWith('.js'))
  })
  if (hasCode) return 'code'

  const hasDocs = stagedFiles.map(
    (f) => f.path.startsWith('docs/') || f.path.endsWith('.md')
  )
  if (hasDocs) return 'docs'

  const hasConfig = stagedFiles.map(
    (f) =>
      f.path === 'package.json' ||
      f.path === 'pnpm-lock.yaml' ||
      f.path === 'package-lock.json' ||
      f.path === 'yarn.lock' ||
      f.path === 'tsconfig.json' ||
      f.path.endsWith('.config.js') ||
      f.path.endsWith('.config.ts') ||
      f.path.startsWith('.prettierc') ||
      f.path.startsWith('.eslintrc')
  )
  if (hasConfig) return 'config'

  return 'chore'
}

export function mapChangeTypeToPrefix(changeType: string): string {
  switch (changeType) {
    case 'code':
      return 'feat'
    case 'docs':
      return 'docs'
    case 'config':
      return 'chore'
    default:
      return 'chore'
  }
}

// New prefix logic

export function detectCommitType(stagedFiles: FileStatus) {}
