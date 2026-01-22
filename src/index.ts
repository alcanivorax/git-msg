#!/usr/bin/env node

import { execSync } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import pkg from '../package.json' with { type: 'json' }

const args = process.argv.slice(2)
// i.e git msg help / version

function printVersion(): void {
  console.log(`${pkg.name} version ${pkg.version}`)
}

function printHelp(): void {
  console.log(`
git-msg — generate conventional commit messages

Usage:
  git msg [options]

Options:
  -h, --help        Show help
  -v, --version     Show version

Description:
  Run inside a git repository with staged changes
  to generate a conventional commit message.
`)
}

if (args.includes('help') || args.includes('-h') || args.includes('--help')) {
  printHelp()
  process.exit(0)
}

if (
  args.includes('version') ||
  args.includes('-v') ||
  args.includes('--version')
) {
  printVersion()
  process.exit(0)
}

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

const prefix = mapChangeTypeToPrefix(changeType)

function generateCommitSubject(prefix: string, files: string[]): string {
  if (files.length === 1) {
    return `${prefix}: update ${files[0]}`
  }
  return `${prefix}: update multiple files`
}

const subject = generateCommitSubject(prefix, files)

async function askForConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({ input, output })

  const answer = await rl.question(`Commit with this message? (y/n) `)

  rl.close()

  return answer.trim().toLowerCase() === 'y'
}

function runGitCommit(message: string): void {
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
  })
}

if (!process.stdin.isTTY) {
  console.error('Error: interactive terminal required')
  process.exit(1)
}

async function main() {
  console.log('Suggested commit message:')
  console.log(subject)
  console.log('')

  const confirmed = await askForConfirmation()

  if (!confirmed) {
    console.log('Aborted.')
    process.exit(0)
  }

  runGitCommit(subject)
}

main()
