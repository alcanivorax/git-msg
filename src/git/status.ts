// src/git/status.ts

import { execSync } from 'node:child_process'

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

function getStagedDiff(): string {
  try {
    return execSync('git diff --cached', {
      encoding: 'utf8',
    }).trim()
  } catch {
    return ''
  }
}

export function ensureGitRepo(): void {
  if (!isInsideGitRepo()) {
    console.error('Error: not inside a git repository')
    process.exit(1)
  }
}

export function ensureStagedChanges(): void {
  const diff = getStagedDiff()

  if (!diff) {
    console.error('No staged changes found.')
    process.exit(1)
  }
}
