#!/usr/bin/env node

import { handleCliFlags } from './cli/options.js'
import { ensureGitRepo, ensureStagedChanges } from './git/status.js'
import { getStagedFiles } from './git/files.js'
import { detectChangeType, mapChangeTypeToPrefix } from './logic/classify.js'
import { generateCommitSubject } from './logic/message.js'
import { confirmAndCommit } from './output/print.js'

async function main(): Promise<void> {
  handleCliFlags()

  ensureGitRepo()
  ensureStagedChanges()

  const files = getStagedFiles()

  const changeType = detectChangeType(files)

  const prefix = mapChangeTypeToPrefix(changeType)

  const subject = generateCommitSubject(prefix, files)

  confirmAndCommit(subject)
}

main()
