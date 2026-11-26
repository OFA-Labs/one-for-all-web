# Contributing

## Never commit
Credentials or `.env` files (only `.env.example`), `node_modules/`, `.next/`, caches, test output, logs,
audio or video captures, or local notes.

## Branches and commits
Branch `type/short-slug`; commit `type(scope): summary`. Open pull requests against `staging`.

## Conventions
Files and folders `kebab-case`; features live in `src/features/<name>/` with an `index.ts` public entry;
components and types `PascalCase`; functions and variables `camelCase`; hooks start with `use`.
Features do not import each other (`npm run check:arch`). Read `AGENTS.md` before changing Next.js code.

## Before opening a pull request
```bash
npm run verify
```

## Paths other repositories depend on
`docs/SPEC_ITERATION_1.md` and `AGENTS.md` are read by tests in `one-for-all-api`.
