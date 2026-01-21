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

if (!isInsideGitRepo()) {
  console.error('Error: not inside a git repository')
  process.exit(1)
}

if (!diff) {
  console.error('No staged changed found.')
  process.exit(1)
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
    })

    return output
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

console.log('File changed:')
const files = getStagedFiles()

for (const file of files) {
  console.log(`- ${file}`)
}
