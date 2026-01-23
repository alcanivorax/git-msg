// src/git/commit.ts

import { spawnSync } from 'node:child_process'

export function runGitCommit(message: string): void {
  const result = spawnSync('git', ['commit', '-m', message], {
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
