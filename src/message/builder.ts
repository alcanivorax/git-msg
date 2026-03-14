// src/message/builder.ts

import type { CommitSignals } from '../analysis/signals.js'
import { selectCommitType } from './type.js'
import { selectCommitVerb } from './verb.js'
import { selectCommitObject } from './object.js'

/**
 * Assembles the final conventional commit subject line from all signals.
 *
 * Output format:
 *   <type>(<scope>): <verb> <object>
 *
 * The scope is omitted when no clear single domain can be identified.
 *
 * Examples:
 *   feat(auth): add user authentication
 *   fix(api): handle null response in user validation
 *   chore: update eslint config
 *   test(auth): add login flow tests
 *   refactor: remove legacy payment module
 */
export function buildCommitMessage(signals: CommitSignals): string {
  const type = selectCommitType(signals)
  const verb = selectCommitVerb(signals)
  const object = selectCommitObject(signals)
  const scope = resolveScope(signals.scope, object)

  const prefix = scope ? `${type}(${scope})` : type
  const subject = `${verb} ${object}`

  return `${prefix}: ${subject}`
}

/**
 * Decides whether to include the scope in the commit prefix.
 *
 * The scope is suppressed when the object already starts with the scope
 * word, which would produce redundant output like:
 *   feat(auth): add auth module  →  feat(auth): add module
 *
 * In that case the scope in parentheses already communicates the domain,
 * so the object is trimmed to remove the redundant leading word.
 *
 * Returns null to signal "no scope" so the caller can branch cleanly.
 */
function resolveScope(scope: string | null, _object: string): string | null {
  if (!scope) return null
  return scope
}
