import pkg from '../../package.json' with { type: 'json' }
import { args } from './args.js'

function printHelp(): void {
  console.log(`
git-msg — generate conventional commit messages from staged changes

Usage:
  git msg [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Description:
  Analyzes staged files and generates a conventional commit message.
  Supports types: feat, fix, docs, test, style, refactor, chore, build, ci.
`)
}

function printVersion(): void {
  console.log(`git-msg version ${pkg.version}`)
}

function printUnknownOption(option: string): void {
  console.error(`unknown option: ${option}`)
  console.error(`usage: git msg [-v | --version] [-h | --help]`)
}

export function handleCliFlags(): void {
  if (args.length === 0) return

  if (args.includes('-h') || args.includes('--help') || args.includes('help')) {
    printHelp()
    process.exit(0)
  }

  if (
    args.includes('-v') ||
    args.includes('--version') ||
    args.includes('version')
  ) {
    printVersion()
    process.exit(0)
  }

  printUnknownOption(args[0])
  process.exit(2)
}
