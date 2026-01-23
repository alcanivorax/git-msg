import { runGitCommit } from '../git/commit.js'
import { startInlineEdit } from './editCommit.js'

export async function listenForChoice(subject: string): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error('Error: interactive terminal required')
    process.exit(1)
  }

  console.log('Suggested commit message:')
  console.log(subject)
  console.log('')
  console.log('[e]dit / [u]se / [c]ancel')
  console.log('')

  process.stdin.setRawMode(true)
  process.stdin.resume()

  let hintShown = false

  const onKey = (chunk: Buffer) => {
    const key = chunk.toString().toLowerCase().trim()

    if (key === 'u') {
      cleanup()
      runGitCommit(subject)
      return
    }

    if (key === 'e') {
      cleanup()
      process.stdout.write('\r\x1b[K')
      startInlineEdit(subject)
      return
    }

    if (key === 'c' || key === '\u0003') {
      cleanup()
      process.stdout.write('\r\x1b[K')
      console.log('Aborted.')
      process.exit(0)
    }
    if (!hintShown) {
      process.stdout.write('\r\x1b[KPress e, u, or c ')
      hintShown = true
    }
  }

  process.stdin.on('data', onKey)

  function cleanup() {
    process.stdin.removeListener('data', onKey)
    process.stdin.setRawMode(false)
    process.stdin.pause()
  }
}
