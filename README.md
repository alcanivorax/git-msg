# git-msg

<br />

> A Git‑native commit message prompt that feels like a natural part of your workflow.

`git-msg` makes writing good commit messages the default. It removes the awkward pause during `git commit` by showing a clear, conventional message you can **use, edit, or cancel** instantly — without breaking flow.

No AI. No editors. No config hell.

---

<br />

**Good commit messages don’t happen by accident.**  
**git-msg makes them the default.**

---

<br />

## Why git-msg exists

Most bad commit messages aren’t written out of laziness — they’re written because the developer has **no starting thought**.

```bash
git commit -m "..."
```

`git-msg` fixes that by:

- analyzing **what changed** (paths, file status, magnitude)
- suggesting a **clear, conventional commit message idea**
- letting the **developer stay in control**

It doesn’t replace thinking — it removes friction so thinking happens.

---

<br />

## What git-msg is (and isn’t)

### ✅ git-msg is

- a commit _idea generator_
- a habit‑builder for better commit messages
- fast, deterministic, and explainable
- language‑agnostic
- editable by default

### ❌ git-msg is not

- an AI tool
- a diff / AST analyzer
- a rule engine or DSL
- a replacement for human intent

---

<br />

## Commit message grammar

All suggestions follow this shape:

```
<type>: <verb> <object> [qualifier]
```

Examples:

```
feat: add auth module
fix: handle empty config
refactor: simplify commit flow
docs: clarify setup instructions
chore: update build config
```

This keeps messages:

- readable
- consistent
- easy to edit

---

<br />

## Usage

Stage your changes as usual:

```bash
git add .
```

Then run:

```bash
git msg
```

You’ll see something like:

```
Suggested commit message:
feat: update auth logic

[e]dit / [u]se / [c]ancel
```

<br />

### Options

- **`u`** — commit immediately
- **`e`** — edit inline, then auto‑commit
- **`c`** — abort

No Enter required for the choice.

---

<br />

## Inline editing (no editor)

Choosing **edit** opens a single‑line inline prompt:

```
Edit commit message:
> feat: update auth logic
```

- edit like a shell prompt
- press **Enter** to commit
- **Ctrl+C** to abort

No vim. No nano. No `$EDITOR`.

---

<br />

## How git-msg decides the suggestion

`git-msg` uses **safe, structural signals only**:

- file status (`A`, `M`, `D`, `R`)
- file paths
- change magnitude (rough size)

It intentionally avoids:

- full diff analysis
- AST parsing
- language‑specific logic
- semantic guessing

This keeps suggestions:

- fast
- predictable
- easy to override

When unsure, `git-msg` prefers being **generic rather than wrong**.

---

<br />

## Supported projects

`git-msg` is **language‑agnostic**.

It works equally well for:

- JavaScript / TypeScript
- Go
- Python
- Rust
- Java
- mixed or monorepos

The tool cares about **structure and intent**, not languages.

---

<br />

## Philosophy

> git-msg doesn’t force you to write good commit messages.
> It makes writing bad ones uncomfortable.

The goal is not perfection — it’s **clarity by default**.

---

<br />

## Status

- v0.1 — heuristic‑based core
- no AI
- no config
- focused on daily use

Future versions may refine heuristics, but the core philosophy will stay the same.

---

<br />

## License

MIT
