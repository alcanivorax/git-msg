#!/usr/bin/env node

import { handleCliFlags } from './cli/options.js'
import { ensureGitRepo, ensureStagedChanges } from './git/status.js'
import { getStagedFilesWithStatus } from './git/files.js'
import {
  detectChangeCategory,
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

  const prefix = mapChangeCategoryToCommitType(changeCategory)

  const subject = generateCommitSubject(prefix, stagedFiles)

  await listenForChoice(subject)
}

main()
