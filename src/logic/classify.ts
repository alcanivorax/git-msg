// src/analyze/classify.ts

import { FileStatus, StagedStats } from '../git/files.js'

type ChangeCategory =
  | 'code'
  | 'tests'
  | 'docs'
  | 'ci'
  | 'config'
  | 'build'
  | 'chore'

export function detectChangeCategory(
  stagedFiles: FileStatus[]
): ChangeCategory {
  if (stagedFiles.length === 0) return 'chore'

  const hasCode = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/')
    return (
      path.startsWith('src/') ||
      path.startsWith('lib/') ||
      path.startsWith('app/') ||
      path.startsWith('packages/') ||
      path.startsWith('package/') ||
      path.startsWith('pkg/') ||
      path.startsWith('cli/') ||
      path.startsWith('cmd/') ||
      path.startsWith('core/') ||
      path.startsWith('internal/') ||
      path.startsWith('components/') ||
      path.startsWith('utils/') ||
      path.startsWith('helpers/') ||
      path.startsWith('services/') ||
      path.startsWith('api/') ||
      path.startsWith('controllers/') ||
      path.startsWith('models/') ||
      path.startsWith('views/') ||
      path.startsWith('routes/') ||
      path.startsWith('middleware/') ||
      // File extensions for source code
      /\.(ts|tsx|js|jsx|py|go|rs|java|cpp|c|h|hpp|cs|php|rb|kt|swift|scala|clj)$/.test(
        path
      )
    )
  })

  if (hasCode) return 'code'

  const hasTests = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/')
    return (
      path.startsWith('tests/') ||
      path.startsWith('test/') ||
      path.startsWith('__tests__/') ||
      path.startsWith('e2e/') ||
      path.startsWith('integration/') ||
      path.startsWith('unit/') ||
      path.includes('.test.') ||
      path.includes('.spec.') ||
      path.includes('_test.') ||
      path.includes('Test.') ||
      path.includes('Spec.')
    )
  })

  if (hasTests) return 'tests'

  const hasDocs = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/')
    return (
      path.startsWith('docs/') ||
      path.startsWith('documentation/') ||
      path.endsWith('.md') ||
      path.endsWith('.mdx') ||
      path.endsWith('.rst') ||
      path.endsWith('.txt') ||
      path.includes('README') ||
      path.includes('CHANGELOG') ||
      path.includes('CONTRIBUTING') ||
      path.includes('LICENSE')
    )
  })

  if (hasDocs) return 'docs'

  const hasCI = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/')
    return (
      path.startsWith('.github/') ||
      path.startsWith('.gitlab/') ||
      path.startsWith('.circleci/') ||
      path.startsWith('.travis/') ||
      path.startsWith('.azure/') ||
      path.startsWith('jenkins/') ||
      path.includes('Jenkinsfile') ||
      path.includes('.travis.yml') ||
      path.includes('azure-pipelines') ||
      path.includes('gitlab-ci')
    )
  })

  if (hasCI) return 'ci'

  const hasConfig = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/')
    return (
      path.includes('package.json') ||
      path.includes('package-lock.json') ||
      path.includes('yarn.lock') ||
      path.includes('pnpm-lock.yaml') ||
      path.includes('go.mod') ||
      path.includes('go.sum') ||
      path.includes('Cargo.toml') ||
      path.includes('Cargo.lock') ||
      path.includes('pyproject.toml') ||
      path.includes('poetry.lock') ||
      path.includes('requirements.txt') ||
      path.includes('Pipfile') ||
      path.includes('Gemfile') ||
      path.includes('build.gradle') ||
      path.includes('pom.xml') ||
      path.includes('tsconfig.json') ||
      path.includes('jsconfig.json') ||
      path.includes('.eslintrc') ||
      path.includes('.prettierrc') ||
      path.includes('.babelrc') ||
      path.includes('webpack.config') ||
      path.includes('vite.config') ||
      path.includes('rollup.config') ||
      path.includes('.env') ||
      path.includes('.config.') ||
      path.startsWith('config/')
    )
  })

  if (hasConfig) return 'config'

  const hasBuild = stagedFiles.some((f) => {
    const path = f.path.replace(/\\/g, '/').toLowerCase()
    return (
      path.includes('docker') ||
      path.includes('makefile') ||
      path.includes('dockerfile') ||
      path.includes('.dockerfile') ||
      path.includes('docker-compose') ||
      path.startsWith('build/') ||
      path.startsWith('dist/') ||
      path.includes('webpack') ||
      path.includes('vite') ||
      path.includes('rollup') ||
      path.includes('esbuild') ||
      path.includes('gulpfile') ||
      path.includes('gruntfile')
    )
  })

  if (hasBuild) return 'build'

  return 'chore'
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

export function detectCommitObject(stagedFiles: FileStatus[]): string {
  if (stagedFiles.length === 0) return 'project' // Guard against empty input

  const paths = stagedFiles.map((f) => f.path.replace(/\\/g, '/'))

  if (paths.length === 1) {
    return humanizeFile(paths[0])
  }

  const domains = paths.map(extractMeaningfulDir).filter(Boolean)

  // If no meaningful directories found, fall back early
  if (domains.length === 0) return 'project'

  const counts = count(domains)
  const [top, freq] = mostCommon(counts)

  // Majority threshold: 60% of files in same domain
  if (top && freq / paths.length >= 0.6) {
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

  // No suffix needed (standalone domains)
  if (suffix === null) return domain

  // Avoid redundancy: "tests tests" → "tests"
  if (suffix && domain.endsWith(suffix)) return domain

  // Special case: pluralization check
  const singularSuffix = suffix?.replace(/s$/, '')
  if (singularSuffix && domain.endsWith(singularSuffix)) {
    return domain // e.g., "component" with suffix "components"
  }

  // Apply suffix or default to "module"
  return suffix ? `${domain} ${suffix}` : `${domain} module`
}

export function count<T>(values: T[]): Map<T, number> {
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
  // Renamed param to avoid confusion
  const normalized = filePath.replace(/\\/g, '/')
  const file = normalized.split('/').pop() ?? normalized

  return file
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_.]/g, ' ') // Added dot for cases like 'file.test'
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim() // Clean edges
    .toLowerCase()
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
  const parts = normalized.split('/').filter(Boolean) // Remove empty strings upfront

  for (const part of parts) {
    if (part.startsWith('.')) continue // Skip hidden dirs
    if (GENERIC_DIRS.has(part)) continue // Skip generic dirs
    if (part.includes('.')) break // Stop at filename

    return part.toLowerCase()
  }

  return null
}

// todo: future addition
/*
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

export function detectCommitQualifier(
  stagedFiles: FileStatus[],
  stats: StagedStats
): string | null {
  const paths = stagedFiles.map((f) => f.path.replace(/\\/g, '/').toLowerCase())

  // CI / Infra
  if (paths.some((p) => p.startsWith('.github/workflows'))) {
    return 'for ci'
  }

  // Environment-specific
  if (paths.some((p) => p.includes('production') || p.includes('prod'))) {
    return 'for production'
  }

  if (paths.some((p) => p.includes('staging'))) {
    return 'for staging'
  }

  if (paths.some((p) => p.includes('development') || p.includes('dev'))) {
    return 'for development'
  }

  // Large, cross-cutting change
  if (stats.files > 10) {
    return 'across project'
  }

  return null
}
