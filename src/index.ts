#!/usr/bin/env node

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

if (!isInsideGitRepo()) {
  console.error('Error: not inside a git repository')
  process.exit(1)
}

function getStagedDiff(): string {
  try {
    return execSync('git diff --cached', {
      encoding: 'utf8',
    })
  } catch {
    return ''
  }
}

const diff = getStagedDiff().trim()

if (!diff) {
  console.error('No staged changed found.')
  process.exit(1)
}
