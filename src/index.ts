#!/usr/bin/env node

import { handleCliFlags } from './cli/flags.js'
import { ensureGitRepo, ensureStagedChanges } from './git/repo.js'
import { getStagedFiles, getStagedStats, getStagedDiff } from './git/staged.js'
import { analyzeDiff } from './analysis/diff.js'
import { gatherSignals } from './analysis/signals.js'
import { buildCommitMessage } from './message/builder.js'
import { showPrompt } from './ui/prompt.js'

async function main(): Promise<void> {
  handleCliFlags()

  ensureGitRepo()
  ensureStagedChanges()

  const files = getStagedFiles()
  const stats = getStagedStats()
  const diff = analyzeDiff(getStagedDiff())
  const signals = gatherSignals(files, stats, diff)
  const message = buildCommitMessage(signals)

  await showPrompt(message)
}

await main()
