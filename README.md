<h1 align="center">git-msg</h1>

<br />

<p align="center">
 <img
    src="https://raw.githubusercontent.com/alcanivorax/git-msg/main/assets/git-msg-preview.gif"
    alt="git-msg demo"
    width="900"
  />
</p>

<br />

<p align="center">
  A Git-native CLI that suggests conventional commit messages from staged changes.
</p>

<br />

`git-msg` removes the pause before `git commit`. It shows a clear, editable commit message based on what you staged, then lets you use it, edit it, or cancel — instantly.

No AI. No editors. No config.

<br>

<br>

## Usage

Install:

```bash
npm i -g @alcanivorax/git-msg
```

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
feat: update auth module

[e]dit / [u]se / [c]ancel
```

<br>

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
> feat: update auth module
```

- edit like a shell input
- Enter to commit
- Ctrl+C to cancel

No vim. No nano. No `$EDITOR`.

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

## License

MIT
