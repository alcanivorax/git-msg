// src/analysis/categories.ts

import type { StagedFile } from '../git/staged.js'

export type ChangeCategory =
  | 'code'
  | 'tests'
  | 'docs'
  | 'ci'
  | 'config'
  | 'build'
  | 'styles'
  | 'chore'

/**
 * Priority order for resolving ties between categories.
 * Higher index = higher priority when a category meets the dominance threshold.
 */
const PRIORITY: ChangeCategory[] = [
  'code',
  'styles',
  'tests',
  'docs',
  'config',
  'build',
  'ci',
]

/** Classifies a single file path into a ChangeCategory. */
function classifyFile(filePath: string): ChangeCategory {
  const p = filePath.replace(/\\/g, '/').toLowerCase()
  const name = p.split('/').pop() ?? ''

  // ── CI / CD ───────────────────────────────────────────────────────────────
  if (p.startsWith('.github/workflows/') || p.startsWith('.github/actions/'))
    return 'ci'
  if (p.includes('/.gitlab-ci') || name === '.gitlab-ci.yml') return 'ci'
  if (p.includes('/.circleci/') || p.includes('/azure-pipelines')) return 'ci'
  if (p.includes('/jenkinsfile') || name === '.travis.yml') return 'ci'
  if (name === 'appveyor.yml' || name.startsWith('.drone')) return 'ci'
  if (name === 'bitbucket-pipelines.yml') return 'ci'

  // ── Build system ──────────────────────────────────────────────────────────
  if (p.includes('/dockerfile') || p.endsWith('.dockerfile')) return 'build'
  if (p.includes('/makefile') || p.includes('/cmake') || p.includes('/bazel'))
    return 'build'
  if (p.includes('/build/') || p.includes('/dist/')) return 'build'
  if (name.startsWith('docker-compose')) return 'build'
  if (
    name === 'webpack.config.js' ||
    name === 'vite.config.js' ||
    name === 'rollup.config.js' ||
    name === 'esbuild.config.js'
  )
    return 'build'

  // ── Dependencies / lock files ─────────────────────────────────────────────
  if (
    [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
    ].includes(name)
  )
    return 'config'
  if (['cargo.toml', 'cargo.lock', 'go.mod', 'go.sum'].includes(name))
    return 'config'
  if (
    [
      'requirements.txt',
      'pipfile',
      'pipfile.lock',
      'poetry.lock',
      'pyproject.toml',
    ].includes(name)
  )
    return 'config'
  if (
    ['gemfile', 'gemfile.lock', 'composer.json', 'composer.lock'].includes(name)
  )
    return 'config'

  // ── Config files ──────────────────────────────────────────────────────────
  if (['tsconfig.json', 'jsconfig.json'].includes(name)) return 'config'
  if (
    name.endsWith('.config.json') ||
    name.endsWith('.config.yaml') ||
    name.endsWith('.config.yml') ||
    name.endsWith('.config.toml')
  )
    return 'config'
  if (name.includes('.config.') || name.endsWith('rc')) return 'config'
  if (name.startsWith('.') && !name.endsWith('.md')) return 'config'
  if (
    p.includes('/config/') ||
    p.includes('/configs/') ||
    p.includes('/settings/')
  )
    return 'config'
  if (name.includes('.env') || name === 'environment') return 'config'

  // ── Documentation ─────────────────────────────────────────────────────────
  if (p.startsWith('docs/') || p.startsWith('doc/')) return 'docs'
  if (
    p.endsWith('.md') ||
    p.endsWith('.mdx') ||
    p.endsWith('.rst') ||
    p.endsWith('.txt')
  )
    return 'docs'
  if (['readme', 'changelog', 'license'].includes(name)) return 'docs'

  // ── Tests ─────────────────────────────────────────────────────────────────
  if (
    p.includes('/test/') ||
    p.includes('/tests/') ||
    p.includes('/__tests__/')
  )
    return 'tests'
  if (p.includes('.test.') || p.includes('.spec.') || p.includes('_test.'))
    return 'tests'
  if (p.includes('/e2e/') || p.includes('/integration/')) return 'tests'
  if (['jest.config.js', 'vitest.config.js', 'vitest.config.ts'].includes(name))
    return 'tests'

  // ── Styles ────────────────────────────────────────────────────────────────
  if (
    p.endsWith('.css') ||
    p.endsWith('.scss') ||
    p.endsWith('.sass') ||
    p.endsWith('.less')
  )
    return 'styles'
  if (p.includes('/styles/') || p.includes('/css/')) return 'styles'

  // ── Default: source code ──────────────────────────────────────────────────
  return 'code'
}

/** Returns the dominant ChangeCategory across all staged files. */
export function classifyFiles(files: StagedFile[]): ChangeCategory {
  if (files.length === 0) return 'chore'

  const counts = new Map<ChangeCategory, number>()
  for (const file of files) {
    const cat = classifyFile(file.path)
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }

  return pickDominant(counts, files.length)
}

function pickDominant(
  counts: Map<ChangeCategory, number>,
  total: number
): ChangeCategory {
  if (counts.size === 0) return 'chore'
  if (counts.size === 1) return [...counts.keys()][0]

  // A high-priority category wins if it accounts for ≥ 30% of files
  for (const category of [...PRIORITY].reverse()) {
    const count = counts.get(category) ?? 0
    if (count / total >= 0.3) return category
  }

  // Fall back to the most frequent category
  const [topCategory, topCount] = [...counts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0]

  // Too fragmented across many categories → chore
  if (topCount / total < 0.25 && counts.size > 3) return 'chore'

  return topCategory
}
