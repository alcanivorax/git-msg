// src/analyze/classify.ts

import { count } from 'node:console'
import { FileStatus, StagedStats } from '../git/files.js'

/*
    ===============================================
    =================== Type ======================
    ===============================================
*/

type ChangeCategory =
  | 'code'
  | 'tests'
  | 'docs'
  | 'ci'
  | 'config'
  | 'build'
  | 'styles'
  | 'chore'

// Priority order for category precedence (higher index = higher priority)
const CATEGORY_PRIORITY: ChangeCategory[] = [
  'code',
  'styles',
  'tests',
  'docs',
  'config',
  'build',
  'ci',
]

function classifyFile(path: string): ChangeCategory {
  const p = path.replace(/\\/g, '/').toLowerCase()
  const filename = p.split('/').pop() ?? ''

  // CI/CD (highest priority - infrastructure)
  if (p.startsWith('.github/workflows/') || p.startsWith('.github/actions/'))
    return 'ci'
  if (p.includes('/.gitlab-ci') || filename === '.gitlab-ci.yml') return 'ci'
  if (p.includes('/.circleci/')) return 'ci'
  if (p.includes('/azure-pipelines') || filename.startsWith('azure-pipelines'))
    return 'ci'
  if (p.includes('/jenkinsfile') || filename === 'jenkinsfile') return 'ci'
  if (filename === '.travis.yml' || filename === 'appveyor.yml') return 'ci'
  if (filename.startsWith('.drone') || filename === 'bitbucket-pipelines.yml')
    return 'ci'

  // Build system
  if (p.includes('/dockerfile') || p.endsWith('.dockerfile')) return 'build'
  if (p.includes('/makefile') || p.includes('/cmake') || p.includes('/bazel'))
    return 'build'
  if (p.includes('/build/') || p.includes('/dist/')) return 'build'
  if (filename.startsWith('build.') || filename === 'webpack.config.js')
    return 'build'
  if (
    filename === 'vite.config.js' ||
    filename === 'rollup.config.js' ||
    filename === 'esbuild.config.js'
  )
    return 'build'
  if (filename.startsWith('docker-compose')) return 'build'

  // Configuration & Dependencies
  // Package managers
  if (
    filename === 'package.json' ||
    filename === 'package-lock.json' ||
    filename === 'yarn.lock' ||
    filename === 'pnpm-lock.yaml'
  )
    return 'config'
  if (
    filename === 'cargo.toml' ||
    filename === 'cargo.lock' ||
    filename === 'go.mod' ||
    filename === 'go.sum'
  )
    return 'config'
  if (
    filename === 'requirements.txt' ||
    filename === 'pipfile' ||
    filename === 'pipfile.lock' ||
    filename === 'poetry.lock' ||
    filename === 'pyproject.toml'
  )
    return 'config'
  if (filename === 'gemfile' || filename === 'gemfile.lock') return 'config'
  if (filename === 'composer.json' || filename === 'composer.lock')
    return 'config'

  // Config files
  if (
    filename.includes('.config.') ||
    (filename.startsWith('.') && !filename.endsWith('.md')) ||
    filename.endsWith('rc')
  )
    return 'config'
  if (
    p.includes('/config/') ||
    p.includes('/configs/') ||
    p.includes('/settings/')
  )
    return 'config'
  if (filename.includes('.env') || filename === 'environment') return 'config'

  // Only classify as config if in obvious config locations or specific names
  if (
    filename === 'tsconfig.json' ||
    filename === 'jsconfig.json' ||
    filename.endsWith('.config.json') ||
    filename.endsWith('.config.yaml') ||
    filename.endsWith('.config.yml') ||
    filename.endsWith('.config.toml')
  )
    return 'config'

  // Documentation
  if (p.startsWith('docs/') || p.startsWith('doc/')) return 'docs'
  if (
    p.endsWith('.md') ||
    p.endsWith('.mdx') ||
    p.endsWith('.txt') ||
    p.endsWith('.rst')
  )
    return 'docs'
  if (
    filename === 'readme' ||
    filename === 'changelog' ||
    filename === 'license'
  )
    return 'docs'

  // Tests
  if (
    p.includes('/test/') ||
    p.includes('/tests/') ||
    p.includes('/__tests__/')
  )
    return 'tests'
  if (p.includes('.test.') || p.includes('.spec.') || p.includes('_test.'))
    return 'tests'
  if (p.includes('/e2e/') || p.includes('/integration/')) return 'tests'
  if (filename === 'jest.config.js' || filename === 'vitest.config.js')
    return 'tests'

  // Styles
  if (
    p.endsWith('.css') ||
    p.endsWith('.scss') ||
    p.endsWith('.sass') ||
    p.endsWith('.less')
  )
    return 'styles'
  if (p.includes('/styles/') || p.includes('/css/')) return 'styles'

  // Default: code (source files)
  return 'code'
}

/* todo
if (isCI(p, filename)) return 'ci'
if (isBuild(p, filename)) return 'build'
if (isConfig(p, filename)) return 'config'
if (isDocs(p, filename)) return 'docs'
if (isTests(p, filename)) return 'tests'
if (isStyles(p, filename)) return 'styles'
return 'code'

*/

export function detectChangeCategory(
  stagedFiles: FileStatus[]
): ChangeCategory {
  if (stagedFiles.length === 0) return 'chore'

  const counts = new Map<ChangeCategory, number>()

  for (const file of stagedFiles) {
    const category = classifyFile(file.path)
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  return pickDominantCategory(counts, stagedFiles.length)
}

function pickDominantCategory(
  counts: Map<ChangeCategory, number>,
  totalFiles: number
): ChangeCategory {
  if (counts.size === 0) return 'chore'

  // Single category? Use it
  if (counts.size === 1) {
    const [[category]] = counts
    return category
  }

  const entries = [...counts.entries()]

  // High-priority categories win if they represent significant portion
  const highPriorityThreshold = 0.3 // 30% of files

  for (const category of CATEGORY_PRIORITY.slice().reverse()) {
    const count = counts.get(category)
    if (count && count / totalFiles >= highPriorityThreshold) {
      return category
    }
  }

  // Otherwise, pick most common
  const [topCategory, topCount] = entries.sort((a, b) => b[1] - a[1])[0]

  // If highly fragmented (no category has >25% of files) → chore
  if (topCount / totalFiles < 0.25 && entries.length > 3) {
    return 'chore'
  }

  return topCategory
}

export function mapChangeCategoryToCommitType(changeCategory: string): string {
  switch (changeCategory) {
    case 'code':
      return 'feat'
    case 'docs':
      return 'docs'
    case 'tests':
      return 'test'
    case 'config':
      return 'chore'
    case 'ci':
      return 'ci'
    case 'build':
      return 'build'
    default:
      return 'chore'
  }
}

/*
    ===============================================
    =================== Verb ======================
    ===============================================
*/

export function detectCommitVerb(
  stagedFiles: FileStatus[],
  stats: StagedStats
): string {
  const statuses = new Set(stagedFiles.map((f) => f.status))
  const totalChanges = stats.insertions + stats.deletions

  // Highest-signal structural actions
  if (statuses.has('R')) return 'rename'
  if (statuses.has('A')) return 'add'
  if (statuses.has('D')) return 'remove'
  if (statuses.has('C')) return 'add'

  const onlyModified = statuses.size === 1 && statuses.has('M')

  // Very small, isolated change -> fix
  if (onlyModified && totalChanges > 0 && totalChanges <= 5) return 'fix'

  // Medium structural change, no lifecycle change -> refactor
  if (onlyModified && totalChanges > 5 && totalChanges <= 50) return 'refactor'

  // Everything else that modifies files
  if (statuses.has('M')) return 'update'

  return 'handle'
}
// Note:  const status = rawStatus[0] // handles R100, C75, etc.

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
  | 'components' // React/Vue components
  | 'styles' // CSS/SCSS files
  | 'hooks' // React hooks
  | 'types' // TypeScript types
  | 'schemas' // Validation schemas
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

/*
    ===============================================
    ================ Qualifier ====================
    ===============================================
*/

export function detectCommitQualifier(
  stagedFiles: FileStatus[],
  stats: StagedStats
): string | null {
  const paths = stagedFiles.map((f) => f.path.replace(/\\/g, '/').toLowerCase())

  // Environment-related files (broad)
  if (paths.some((p) => p.includes('.env'))) {
    return 'for environment'
  }

  // Large, cross-cutting change
  if (stats.files >= 10) {
    return 'project-wide'
  }

  return null
}
