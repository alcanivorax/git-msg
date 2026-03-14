// src/git/staged.ts

import { execSync } from 'node:child_process'

export type FileStatus = 'A' | 'M' | 'D' | 'R' | 'C'

export type StagedFile = {
  status: FileStatus
  path: string
}

export type StagedStats = {
  files: number
  insertions: number
  deletions: number
}

/** Returns staged files with their git status codes. */
export function getStagedFiles(): StagedFile[] {
  try {
    const output = execSync('git diff --cached --name-status', {
      encoding: 'utf8',
    })

    return output
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawStatus, ...pathParts] = line.split(/\s+/)
        // git may suffix status with a similarity score, e.g. R100, C75 — take only the first char
        const status = rawStatus[0] as FileStatus
        return { status, path: pathParts.join(' ') }
      })
  } catch {
    return []
  }
}

/** Returns insertion/deletion counts for the staged changeset. */
export function getStagedStats(): StagedStats {
  try {
    const output = execSync('git diff --cached --stat', { encoding: 'utf8' })

    const match = output.match(
      /(\d+)\s+files?\s+changed(?:,\s+(\d+)\s+insertions?\(\+\))?(?:,\s+(\d+)\s+deletions?\(-\))?/
    )

    if (!match) return { files: 0, insertions: 0, deletions: 0 }

    return {
      files: parseInt(match[1] ?? '0', 10),
      insertions: parseInt(match[2] ?? '0', 10),
      deletions: parseInt(match[3] ?? '0', 10),
    }
  } catch {
    return { files: 0, insertions: 0, deletions: 0 }
  }
}

/**
 * Returns the raw staged diff, capped at 100 KB to keep analysis fast.
 * Returns an empty string when the diff cannot be read.
 */
export function getStagedDiff(): string {
  try {
    const output = execSync('git diff --cached', { encoding: 'utf8' })
    return output.slice(0, 100_000)
  } catch {
    return ''
  }
}
