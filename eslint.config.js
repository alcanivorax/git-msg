import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

export default [
  // ── Ignored paths ────────────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // ── Source files ─────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Enables type-aware rules
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // ── Correctness ────────────────────────────────────────────────────

      // Prefer native TS-aware version over base ESLint
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

      // Catch async functions whose returned promise is never awaited or handled
      '@typescript-eslint/no-floating-promises': 'error',

      // Prevent accidentally throwing strings, numbers, or plain objects
      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',

      // Catch useless `as SomeType` casts that the compiler already knows
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // Disallow `any` — use `unknown` when the type is truly unknown
      '@typescript-eslint/no-explicit-any': 'warn',

      // ── Style / consistency ────────────────────────────────────────────

      // Enforce `import type` for type-only imports — keeps runtime output clean
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // === instead of == everywhere
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // ── Sanity ────────────────────────────────────────────────────────

      'no-console': 'off',
      'prefer-const': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },

  // ── Test files — relaxed rules ────────────────────────────────────────────
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Type-aware rules that are too noisy in test helpers
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]
