# Contributing

This document covers everything you need to get the project running locally and make a change.

---

## Setup

Fork the repository, then clone your fork:

```bash
git clone https://github.com/<your-username>/git-msg.git
cd git-msg
```

Install dependencies:

```bash
pnpm install
```

---

## Development

Run the CLI directly against your local staged changes (no build step needed):

```bash
pnpm dev
```

This uses `tsx` to run `src/index.ts` directly, so changes are reflected immediately.

---

## Commands

| Command             | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Run the CLI from source against your actual staged files |
| `pnpm build`        | Compile TypeScript to `dist/`                            |
| `pnpm typecheck`    | Type-check without emitting output                       |
| `pnpm test`         | Run the test suite once                                  |
| `pnpm test:watch`   | Run tests in watch mode                                  |
| `pnpm lint`         | Lint all source files                                    |
| `pnpm lint:fix`     | Lint and auto-fix                                        |
| `pnpm format`       | Format all files with Prettier                           |
| `pnpm format:check` | Check formatting without writing                         |

Before opening a PR, make sure all of these pass cleanly:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

---

## Project structure

```
src/
├── index.ts              Entry point — wires the pipeline together
├── cli/
│   ├── args.ts           Raw process.argv slice
│   └── flags.ts          --help / --version handling
├── git/
│   ├── repo.ts           Git repo validation guards
│   ├── staged.ts         Query staged files, stats, and raw diff
│   └── commit.ts         Execute git commit -m
├── analysis/
│   ├── categories.ts     Classify file paths into change categories
│   ├── diff.ts           Parse raw diff — extract symbols, fix patterns, imports
│   ├── scope.ts          Detect commit scope from file paths
│   └── signals.ts        Aggregate everything into CommitSignals
├── message/
│   ├── type.ts           Select the commit type (feat, fix, chore, …)
│   ├── verb.ts           Select the verb (add, fix, refactor, …)
│   ├── object.ts         Select the object (user authentication, api, …)
│   └── builder.ts        Assemble the final message string
└── ui/
    ├── prompt.ts         Keypress prompt (e / u / c)
    └── editor.ts         Inline readline edit mode
```

All analysis feeds into a single `CommitSignals` object defined in `analysis/signals.ts`. Every message module (`type`, `verb`, `object`) reads from that one object — nothing is recomputed or passed through multiple layers of arguments.

---

## Adding or changing heuristics

Most contributions will touch one of the four message modules or the diff analyzer. A few things to keep in mind:

- **`analysis/diff.ts`** — Symbol patterns are plain regexes. If you add support for a new language, add a pattern to `SYMBOL_PATTERNS` with a comment identifying the language and what construct it matches.
- **`message/verb.ts`** — The decision order is documented in the JSDoc comment. New signals should slot into the existing priority order rather than appending to the bottom.
- **`message/object.ts`** — `DOMAIN_SUFFIX_MAP` controls what suffix (if any) is appended to a directory-based object. `GENERIC_WORDS` controls which single-word symbol results are considered too vague to use. Both are easy to extend.
- **`analysis/categories.ts`** — File classification is a set of ordered pattern checks. More specific patterns should come before broader ones.

When adding a heuristic, add a test for it in the relevant `__tests__` file. Tests use plain objects — no mocking, no fixtures — so they are easy to write.

---

## Opening a pull request

- Keep changes focused. One logical change per PR.
- If you're changing behavior, update the tests. If you're adding a new heuristic, add tests for both the happy path and the fallthrough case.
- The PR description should explain what signal or problem the change addresses, not just what the code does.
