// src/generate/commit.ts

export function generateCommitSubject(prefix: string, files: string[]): string {
  if (files.length === 1) {
    return `${prefix}: update ${files[0]}`
  }
  return `${prefix}: update multiple files`
}
