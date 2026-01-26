import pkg from '../../package.json' with { type: 'json' }
import { args } from './args.js'

function printVersion(): void {
  console.log(`${pkg.name} version ${pkg.version}`)
}

function printHelp(): void {
  console.log(`
git-msg — generate conventional commit messages from staged changes

Usage:
  git msg [options]

Options:
  -h, --help, help        Show help
  -v, --version, version  Show version

Description:
  Analyze staged files in a git repository and
  generate a conventional commit message automatically.
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
