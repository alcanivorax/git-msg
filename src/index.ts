#!/usr/bin/env node

import { handleCliFlags } from './cli/options.js'
import { ensureGitRepo, ensureStagedChanges } from './git/status.js'
import {
  getStagedFileMagnitude,
  getStagedFilesWithStatus,
} from './git/files.js'
import { detectChangeCategory } from './logic/classify/type.js'
import { mapChangeCategoryToCommitType } from './logic/classify/type.js'
import { detectCommitVerb } from './logic/classify/verb.js'
import { detectCommitObject } from './logic/classify/object.js'
import { detectCommitQualifier } from './logic/classify/qualifier.js'
import { generateCommitSubject } from './logic/message.js'
import { listenForChoice } from './output/print.js'

async function main(): Promise<void> {
  handleCliFlags()

  ensureGitRepo()
  ensureStagedChanges()

  const stagedFiles = getStagedFilesWithStatus()

  const stagedFileStats = getStagedFileMagnitude()

  const changeCategory = detectChangeCategory(stagedFiles)

  const commitType = mapChangeCategoryToCommitType(changeCategory)

  const commitVerb = detectCommitVerb(stagedFiles, stagedFileStats)

  const commitObject = detectCommitObject(stagedFiles)

  const commitQualifier = detectCommitQualifier(stagedFiles, stagedFileStats)

  const subject = generateCommitSubject(
    commitType,
    commitVerb,
    commitObject,
    commitQualifier
  )

  await listenForChoice(subject)
}

await main()
