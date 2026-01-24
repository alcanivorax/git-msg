// src/generate/commit.ts

import { FileStatus } from '../git/files.js'

export function generateCommitSubject(
  type: string,
  verb: string,
  files: FileStatus[]
): string {
  if (files.length === 1) {
    return `${type}: ${verb} ${files[0].path}`
  }
  return `${type}: ${verb} multiple files`
}
