// src/git/status.ts

import { execSync } from 'node:child_process'
import { getStagedFilesWithStatus } from './files.js'

function isInsideGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

export function ensureGitRepo(): void {
  if (!isInsideGitRepo()) {
    console.error('Error: not inside a git repository')
    process.exit(1)
  }
}

export function ensureStagedChanges(): void {
  const stagedFiles = getStagedFilesWithStatus()

  if (stagedFiles.length === 0) {
    console.error('No staged changes found.')
    process.exit(1)
  }
}
