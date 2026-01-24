// src/analyze/classify.ts

import { FileStatus } from '../git/files.js'

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

// detect verb
export function detectCommitVerb(stagedFiles: FileStatus[]): string {
  const statuses = new Set(stagedFiles.map((f) => f.status))

  // order matter
  if (statuses.has('R')) return 'rename'
  if (statuses.has('A')) return 'add'
  if (statuses.has('D')) return 'remove'
  if (statuses.has('M')) return 'update'
  if (statuses.has('C')) return 'add'
  return 'handle'
}

// New prefix logic

/*
  commit message
  <type>: <verb> <object> [qualifier]
  add auth module
  handle empty config
  update commit prompt
  remove unused config
  simplify commit flow


  | Situation                  | Verb                    |
| -------------------------- | ----------------------- |
| New file(s)                | `add`                   |
| Logic change, behavior fix | `handle`                |
| Bug fix                    | `fix`                   |
| Rename / move              | `rename`                |
| Pure refactor              | `refactor` / `simplify` |
| Config change              | `update`                |
| Removal                    | `remove`                |

*/
