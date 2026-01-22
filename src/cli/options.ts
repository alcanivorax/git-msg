import pkg from '../../package.json' with { type: 'json' }
import { args } from './args.js'

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

function printInvalidOption(option: string): void {
  console.error(`
unknown option: ${option}
usage: git msg [-v | --version] [-h | help]
`)
}

export function handleCliFlags(): void {
  if (args.length === 0) return

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

  // unknown option
  printInvalidOption(args[0])
  process.exit(2)
}
