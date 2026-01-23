import readline from 'node:readline'
import { runGitCommit } from '../git/commit.js'

export function startInlineEdit(subject: string): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  console.log('Edit commit message:')
  rl.setPrompt('> ')
  rl.prompt()

  // Pre-fill the line
  rl.write(subject)

  rl.on('line', (input) => {
    const edited = input.trim()

    rl.close()

    if (!edited) {
      console.log('Aborted.')
      process.exit(0)
    }
    // Auto-commit after edit
    runGitCommit(edited)
  })

  rl.on('SIGINT', () => {
    rl.close()
    console.log('\nAborted.')
    process.exit(0)
  })
}
