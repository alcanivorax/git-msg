import type { FileStatus } from '../../git/files.js'

/*
    ===============================================
    ================== Object =====================
    ===============================================
*/

export function detectCommitObject(stagedFiles: FileStatus[]): string {
  if (stagedFiles.length === 0) return 'project' // guard

  const paths = stagedFiles.map((f) => f.path.replace(/\\/g, '/'))

  // Single file → still try domain first, fallback to filename
  if (paths.length === 1) {
    const domain = extractMeaningfulDir(paths[0])
    return domain ? applyObjectSuffix(domain) : humanizeFile(paths[0])
  }

  const domains = paths
    .map(extractMeaningfulDir)
    .filter((d): d is string => Boolean(d))

  // No meaningful domains → project-level change
  if (domains.length === 0) return 'project'

  const counts = superCount(domains)
  const [top, freq] = mostCommon(counts)

  // Majority threshold: 60% of meaningful domains
  if (top && freq / domains.length >= 0.6) {
    return applyObjectSuffix(top)
  }

  return 'project'
}

export type ObjectSuffix =
  | 'module'
  | 'pipeline'
  | 'config'
  | 'system'
  | 'tests'
  | 'components'
  | 'styles'
  | 'hooks'
  | 'types'
  | 'schemas'
  | null

const DOMAIN_SUFFIX_MAP: Record<string, ObjectSuffix> = {
  // Content (standalone, no suffix)
  docs: null,
  documentation: null,
  readme: null,

  // Tooling / Infrastructure
  ci: 'pipeline',
  workflows: 'pipeline',
  actions: 'pipeline', // GitHub Actions
  scripts: 'system',
  build: 'system',
  tooling: 'system',
  docker: 'system', // Docker configs

  // Configuration
  config: 'config',
  configs: 'config',
  settings: 'config',
  env: 'config', // Environment files

  // Testing
  test: 'tests',
  tests: 'tests',
  e2e: 'tests',
  __tests__: 'tests', // Jest convention
  spec: 'tests',

  // UI/Frontend
  components: 'components',
  component: 'components',
  ui: 'components',
  views: 'components',
  pages: 'components',
  layouts: 'components',
  hooks: 'hooks',
  styles: 'styles',
  css: 'styles',
  scss: 'styles',

  // Types & Schemas
  types: 'types',
  interfaces: 'types',
  models: 'types', // Can be schemas or types
  schemas: 'schemas',
  validators: 'schemas',

  // Interface / Tooling (standalone)
  cli: null,
  cmd: null,
  api: null, // API endpoints often standalone
}

export function applyObjectSuffix(domain: string): string {
  const normalized = domain.toLowerCase()
  const suffix = DOMAIN_SUFFIX_MAP[normalized]

  // Standalone domains
  if (suffix === null) return domain

  // Avoid "tests tests"
  if (suffix && domain.endsWith(suffix)) return domain

  // Avoid "component components"
  const singular = suffix?.replace(/s$/, '')
  if (singular && domain.endsWith(singular)) return domain

  return `${domain} ${suffix ?? 'module'}`
}

export function superCount<T>(values: T[]): Map<T, number> {
  // Generic for reusability
  const map = new Map<T, number>()
  for (const v of values) {
    map.set(v, (map.get(v) ?? 0) + 1)
  }
  return map
}

export function mostCommon<T>(counts: Map<T, number>): [T, number] | [null, 0] {
  // Generic for reusability
  let maxKey: T | null = null
  let maxValue = 0

  for (const [key, value] of counts) {
    if (value > maxValue) {
      maxKey = key
      maxValue = value
    }
  }

  return maxKey ? [maxKey, maxValue] : [null, 0]
}

export function humanizeFile(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const file = normalized.split('/').pop() ?? normalized

  const name = file.replace(/\.[^/.]+$/, '') // remove extension

  return (
    name
      // split camelCase / PascalCase
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // split snake_case / kebab-case / dot.case
      .replace(/[-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  )
}

const GENERIC_DIRS = new Set([
  'src',
  'lib',
  'app',
  'apps',
  'packages',
  'pkg',
  'core',
  'internal',
  'utils',
  'helpers',
  'common',
  'shared',
])

export function extractMeaningfulDir(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part.startsWith('.')) continue
    if (GENERIC_DIRS.has(part)) continue

    // Stop only if this is the filename
    if (i === parts.length - 1 && part.includes('.')) break

    return part.toLowerCase()
  }

  return null
}

// todo: future addition (maybe)
/*

fallback
const SUFFIX_PATTERNS: Array<[RegExp, ObjectSuffix]> = [
  [/\.test\.|\.spec\./, 'tests'],
  [/\.config\.|\.rc$/, 'config'],
  [/\.style\.|\.css$/, 'styles'],
]

export function detectSuffixFromPattern(path: string): ObjectSuffix | undefined {
  for (const [pattern, suffix] of SUFFIX_PATTERNS) {
    if (pattern.test(path)) return suffix
  }
}

*/
