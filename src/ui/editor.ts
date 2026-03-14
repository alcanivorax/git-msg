// src/ui/editor.ts

import readline from 'node:readline'
import { runGitCommit } from '../git/commit.js'

/**
 * Opens an inline readline prompt with the suggested message pre-filled,
 * allowing the user to edit it before committing.
 *
 * Behaviour:
 *   - Enter  → commits with the (possibly edited) message
 *   - Ctrl+C → aborts without committing
 *
 * No external editor is launched — everything stays in the terminal.
 */
export function startInlineEdit(message: string): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  console.log('Edit commit message:')
  rl.setPrompt('> ')
  rl.prompt()

  // Pre-fill the input line with the suggested message so the user can
  // move the cursor and make targeted edits rather than retyping everything
  rl.write(message)

  rl.on('line', (input) => {
    const edited = input.trim()
    rl.close()

    if (!edited) {
      console.log('Aborted.')
      process.exit(0)
    }

    runGitCommit(edited)
  })

  rl.on('SIGINT', () => {
    rl.close()
    console.log('\nAborted.')
    process.exit(0)
  })
}
