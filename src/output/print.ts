import { askForConfirmation } from './prompt.js'
import { runGitCommit } from './prompt.js'

if (!process.stdin.isTTY) {
  console.error('Error: interactive terminal required')
  process.exit(1)
}

export async function printCommitMessage(subject: string) {
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
