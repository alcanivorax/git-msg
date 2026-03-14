<h1 align="center">git-msg</h1>

<p align="center">
  <img
    src="https://raw.githubusercontent.com/alcanivorax/git-msg/main/assets/git-msg-preview.gif"
    alt="git-msg demo"
    width="900"
  />
</p>

<p align="center">
  A Git-native CLI that suggests conventional commit messages from staged changes.
</p>

---

`git-msg` removes the pause before `git commit`. Stage your changes, run `git msg`, and get a clear commit message you can use, edit, or cancel — without leaving the terminal.

No AI. No config. No editor.

## Install

```bash
npm i -g @alcanivorax/git-msg
```

## Usage

Stage your changes as usual, then run:

```bash
git add .
git msg
```

You'll see something like:

```
Suggested commit message:

  feat(auth): add user authentication

[e]dit  [u]se  [c]ancel
```

Press a single key — no Enter required.

| Key | Action                               |
| --- | ------------------------------------ |
| `u` | Commit with the suggested message    |
| `e` | Edit the message inline, then commit |
| `c` | Abort                                |

## Inline editing

Pressing `e` opens a prompt with the message pre-filled:

```
Edit commit message:
> feat(auth): add user authentication
```

Edit it like any shell input. `Enter` commits. `Ctrl+C` cancels. No vim, no `$EDITOR`.

## Message format

Suggestions follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <verb> <object>
```

The scope is included when the staged files share a clear module or directory. It is omitted when changes span multiple unrelated areas.

**Examples:**

```
feat(auth): add user authentication
fix(api): handle null response in user validation
feat(auth): implement JWT token refresh
refactor: remove legacy payment module
test(auth): add login flow tests
chore: update eslint config
docs: update contributing guide
ci: update node version matrix
```

## How messages are generated

`git-msg` reads your staged changeset and derives the message from three sources:

**File metadata**

- Git status codes (`A`, `M`, `D`, `R`, `C`) determine the verb — `add`, `remove`, `rename`, etc.
- File paths determine the scope and object — `src/auth/login.ts` → scope `auth`
- Change size (insertions vs. deletions) refines the verb for modification-only changes

**Diff content**

- Newly declared symbols (functions, classes, types, interfaces) are extracted and used as the commit object — `validateUserEmail` → `user email`
- Fix/error keywords in added lines (`error`, `bug`, `crash`, `invalid`, etc.) promote the type to `fix`
- Test framework patterns (`describe`, `it`, `expect`) promote the type to `test`
- New package imports are detected for context

**Classification**

- Files are classified into categories (code, tests, docs, config, build, ci, styles) and the dominant category maps to a commit type
- When signals conflict, higher-confidence signals win — fix patterns beat a generic `feat`, all-deletes become `refactor`

No AI. No AST parsing. No network calls. The tool runs entirely offline and produces a deterministic result for a given set of staged files.

## Options

```
git msg [options]

  -h, --help     Show help
  -v, --version  Show version
```

## License

MIT
