# Contributing

Thanks for your interest in contributing to `git-msg`.

This project favors small, focused changes and predictable behavior.

<br>

## Getting started

Fork the repository and clone your fork:

```bash
git clone https://github.com/<your-username>/git-msg.git
cd git-msg
```

Install dependencies:

```bash
pnpm install
```

Build the project:

```bash
pnpm build
```

Link the CLI locally:

```bash
npm link
```

You can now run:

```bash
git msg
```

<br>

## Development notes

This is a deterministic, heuristic-based tool.

- Avoid adding AI, heavy configuration.
- Keep behavior explainable and easy to override.

<br>

## Testing

Run tests with:

```bash
pnpm test
```

<br>

## Style

- Keep changes small and scoped.
- Follow existing structure and patterns.
- Format code before submitting a PR.
