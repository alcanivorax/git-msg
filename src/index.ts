#!/usr/bin/env node

import { handleCliFlags } from './cli/options.js'
import { ensureGitRepo, ensureStagedChanges } from './git/status.js'
import { getStagedFilesWithStatus } from './git/files.js'
import {
  detectChangeCategory,
  detectCommitVerb,
  mapChangeCategoryToCommitType,
} from './logic/classify.js'
import { generateCommitSubject } from './logic/message.js'
import { listenForChoice } from './output/print.js'

async function main(): Promise<void> {
  handleCliFlags()

  ensureGitRepo()
  ensureStagedChanges()

  const stagedFiles = getStagedFilesWithStatus()

  const changeCategory = detectChangeCategory(stagedFiles)

  const commitType = mapChangeCategoryToCommitType(changeCategory)

  const commitVerb = detectCommitVerb(stagedFiles)

  const subject = generateCommitSubject(commitType, commitVerb, stagedFiles)

  await listenForChoice(subject)
}

await main()
