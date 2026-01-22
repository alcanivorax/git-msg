// src/analyze/classify.ts

export function detectChangeType(files: string[]): string {
  const hasCode = files.some(
    (f) => f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.js'))
  )
  if (hasCode) return 'code'

  const hasDocs = files.some((f) => f.startsWith('docs/') || f.endsWith('.md'))
  if (hasDocs) return 'docs'

  const hasConfig = files.some(
    (f) =>
      f === 'package.json' ||
      f === 'pnpm-lock.yaml' ||
      f === 'package-lock.json' ||
      f === 'yarn.lock' ||
      f === 'tsconfig.json' ||
      f.endsWith('.config.js') ||
      f.endsWith('.config.ts') ||
      f.startsWith('.prettierc') ||
      f.startsWith('.eslintrc')
  )
  if (hasConfig) return 'config'

  return 'chore'
}

export function mapChangeTypeToPrefix(changeType: string): string {
  switch (changeType) {
    case 'code':
      return 'feat'
    case 'docs':
      return 'docs'
    case 'config':
      return 'chore'
    default:
      return 'chore'
  }
}
