// src/git/repo.ts

import { execSync } from 'node:child_process'
import { getStagedFiles } from './staged.js'

function isInsideGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
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
  if (getStagedFiles().length === 0) {
    console.error('No staged changes found. Run `git add` first.')
    process.exit(1)
  }
}
