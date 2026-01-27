import { FileStatus } from '../../git/files.js'

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
