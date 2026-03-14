// src/ui/prompt.ts

import { runGitCommit } from '../git/commit.js'
import { startInlineEdit } from './editor.js'

/**
 * Displays the suggested commit message and waits for a single keypress:
 *
 *   [u] — use the message as-is and commit immediately
 *   [e] — open inline edit mode, then commit
 *   [c] — abort without committing
 *
 * Requires an interactive TTY. Exits with code 1 if stdin is not a terminal.
 */
export async function showPrompt(message: string): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error('Error: interactive terminal required')
    process.exit(1)
  }

  printSuggestion(message)

  return new Promise((resolve) => {
    process.stdin.setRawMode(true)
    process.stdin.resume()

    let hintShown = false

    const onKey = (chunk: Buffer) => {
      const key = chunk.toString().toLowerCase()

      if (key === 'u') {
        cleanup()
        runGitCommit(message)
        resolve()
        return
      }

      if (key === 'e') {
        cleanup()
        clearCurrentLine()
        startInlineEdit(message)
        resolve()
        return
      }

      if (key === 'c' || key === '\u0003' /* Ctrl+C */) {
        cleanup()
        clearCurrentLine()
        console.log('Aborted.')
        process.exit(0)
      }

      // Any other key — show a one-time hint so the user knows what to press
      if (!hintShown) {
        process.stdout.write('\r\x1b[KPress [e]dit, [u]se, or [c]ancel  ')
        hintShown = true
      }
    }

    process.stdin.on('data', onKey)

    function cleanup() {
      process.stdin.removeListener('data', onKey)
      process.stdin.setRawMode(false)
      process.stdin.pause()
    }
  })
}

function printSuggestion(message: string): void {
  console.log('')
  console.log('Suggested commit message:')
  console.log('')
  console.log(`  ${message}`)
  console.log('')
  console.log('[e]dit  [u]se  [c]ancel')
  console.log('')
}

function clearCurrentLine(): void {
  process.stdout.write('\r\x1b[K')
}
