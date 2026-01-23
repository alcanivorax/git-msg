// src/git/files.ts

import { execSync } from 'node:child_process'

export type FileStatus = {
  status: 'A' | 'M' | 'D' | 'R' | 'C'
  path: string
}

type StagedStats = {
  files: number
  insertions: number
  deletions: number
}

export function getStagedFilesWithStatus(): FileStatus[] {
  try {
    const output = execSync('git diff --cached --name-status', {
      encoding: 'utf8',
    })

    return output
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const [status, ...pathParts] = line.split(/\s+/)
        return {
          status: status as FileStatus['status'],
          path: pathParts.join(' '),
        }
      })
  } catch {
    return []
  }
}

export function getStagedFileMagnitude(): StagedStats {
  try {
    const output = execSync('git diff --cached --stat', {
      encoding: 'utf8',
    })

    const match = output.match(
      /(\d+)\s+files?\s+changed(?:,\s+(\d+)\s+insertions?\(\+\))?(?:,\s+(\d+)\s+deletions?\(-\))?/
    )

    if (!match) {
      return { files: 0, insertions: 0, deletions: 0 }
    }
    return {
      files: parseInt(match[1], 10),
      insertions: parseInt(match[2] ?? '0', 10),
      deletions: parseInt(match[3] ?? '0', 10),
    }
  } catch {
    return { files: 0, insertions: 0, deletions: 0 }
  }
}

export function getStagedDiff(): string {
  try {
    return execSync('git diff --cached', {
      encoding: 'utf8',
    })
  } catch {
    return ''
  }
}
