// src/git/commit.ts
import { execSync } from 'node:child_process'

export function runGitCommit(message: string): void {
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
  })
}
