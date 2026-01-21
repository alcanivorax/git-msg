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

const files = getStagedFiles()

function detectChangeType(files: string[]): string {
  const hasCode = files.some(
    (f) => f.startsWith('src/') || f.endsWith('.ts') || f.endsWith('.js')
  )
  if (hasCode) return 'code'

  const hasDocs = files.some((f) => f.startsWith('docs/') || f.endsWith('.md'))
  if (hasDocs) return 'docs'

  const hasConfig = files.some(
    (f) =>
      f === 'package.json' ||
      f.endsWith('lock.yaml') ||
      f.endsWith('config.js') ||
      f.startsWith('.prettierc') ||
      f.startsWith('.eslintrc') ||
      f === 'tsconfig.json'
  )

  if (hasConfig) return 'config'

  return 'chore'
}

const changeType = detectChangeType(files)

function mapChangeTypeToPrefix(changeType: string): string {
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

console.log('Detected change type: ', detectChangeType(files))
console.log('Suggested commit prefix: ', mapChangeTypeToPrefix(changeType))
