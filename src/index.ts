#!/usr/bin/env node

import { handleCliFlags } from './cli/options.js'
import { ensureGitRepo, ensureStagedChanges } from './git/status.js'
import { getStagedFilesWithStatus } from './git/files.js'
import { detectChangeType, mapChangeTypeToPrefix } from './logic/classify.js'
import { generateCommitSubject } from './logic/message.js'
import { listenForChoice } from './output/print.js'

async function main(): Promise<void> {
  handleCliFlags()

  ensureGitRepo()
  ensureStagedChanges()

  const stagedFiles = getStagedFilesWithStatus()

  const changeType = detectChangeType(stagedFiles)

  const prefix = mapChangeTypeToPrefix(changeType)

  const subject = generateCommitSubject(prefix, stagedFiles)

  await listenForChoice(subject)
}

main()
