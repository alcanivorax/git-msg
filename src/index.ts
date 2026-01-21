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

console.log('git-msg running inside a git repo')
