import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

export async function askForConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({ input, output })

  const answer = await rl.question(`Commit with this message? (y/n) `)

  rl.close()

  return answer.trim().toLowerCase() === 'y'
}
