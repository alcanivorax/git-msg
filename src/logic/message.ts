// src/generate/commit.ts

import { FileStatus } from '../git/files.js'

export function generateCommitSubject(
  prefix: string,
  files: FileStatus[]
): string {
  if (files.length === 1) {
    return `${prefix}: update ${files[0].path}`
  }
  return `${prefix}: update multiple files`
}
