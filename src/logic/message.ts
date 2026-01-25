// src/generate/commit.ts

export function generateCommitSubject(
  type: string,
  verb: string,
  object: string,
  qualifier: string | null
): string {
  const message = qualifier
    ? `${verb} ${object} ${qualifier}`
    : `${verb} ${object}`

  return `${type}: ${message}`
}
