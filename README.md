# git-msg

A Git-native CLI that suggests conventional commit messages from staged changes.

`git-msg` removes the pause before `git commit`. It shows a clear, editable commit message based on what you staged, then lets you use it, edit it, or cancel — instantly.

No AI. No editors. No config.

<br>

## Why git-msg exists

Most bad commit messages aren't written out of laziness — they're written because there's no obvious starting point.

```bash
git commit -m "..."
```

`git-msg` fixes that by giving you a reasonable default:

- looks at what changed
- suggests a conventional commit message
- keeps the developer in control

It doesn't decide for you — it removes friction.

<br>

## What it is (and isn't)

### ✅ It is

- a commit message idea generator
- fast, deterministic, and explainable
- language-agnostic
- editable by default

### ❌ It is not

- an AI tool
- a diff / AST analyzer
- a rules engine
- a replacement for intent

<br>

## Commit message format

All suggestions follow:

```bash
<type>: <verb> <object> [qualifier]
```

Examples:

```bash
feat: add auth module
fix: handle empty config
refactor: update commit flow
docs: update setup instructions
chore: update build config
```

Consistent, readable, easy to tweak.

<br>

## Usage

Stage changes as usual:

```bash
git add .
```

Run:

```bash
git msg
```

You'll see:

```bash
Suggested commit message:
feat: update auth logic

[e]dit / [u]se / [c]ancel
```

### Actions

- `u` — commit immediately
- `e` — edit inline, then commit
- `c` — abort

No editor. No prompts. No Enter for the choice.

<br>

## Inline editing (no editor)

Choosing edit opens a single-line prompt:

```bash
Edit commit message:
> feat: update auth logic
```

- edit like a shell input
- Enter to commit
- Ctrl+C to cancel

No vim. No nano. No `$EDITOR`.

<br>

## How suggestions are generated

`git-msg` uses structural signals only:

- file status (`A`, `M`, `D`, `R`)
- file paths
- rough change size

It intentionally avoids:

- diff or AST analysis
- language-specific logic
- semantic guessing

When unsure, it prefers being generic rather than wrong.

<br>

## Supported projects

Language-agnostic. Works well for:

- JavaScript / TypeScript
- Go
- Python
- Rust
- Java
- monorepos and mixed codebases

Structure matters — language doesn't.

<br>

## Philosophy

**git-msg doesn't force good commit messages. It makes bad ones uncomfortable.**

The goal isn't perfection — it's clarity by default.

<br>

## Status

- v0.1 — heuristic-based core
- no AI
- no config
- built for daily use

<br>

## License

MIT
