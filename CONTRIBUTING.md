## Installation

### Local development

```bash
pnpm install
pnpm build
npm link
```

Then use it as:

```bash
git msg
```

### Why `git msg` works

Git treats any executable named `git-<command>` as a subcommand.

So:

```
git-msg  →  git msg
```

---
