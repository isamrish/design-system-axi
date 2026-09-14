# Contributing

Thanks for wanting to contribute.

## Workflow

1. Fork the repo and clone your fork.
2. Create a branch from `main`.
3. Make your change with tests, inside the boundaries in [VISION.md](VISION.md).
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`); release-please builds the changelog and the next version from them.
5. Run the checks below, push your branch, and open a pull request against `main`.

## Repo conventions

- Node 20+, TypeScript, ESM-only.
- Install dependencies with `pnpm install --frozen-lockfile`; run `pnpm run build`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm test`, and `pnpm run build:skill -- --check` before pushing.
- Run `pnpm run format` when `pnpm run format:check` reports drift. After changing dependencies, run `pnpm exec prettier --write pnpm-lock.yaml` so the committed lockfile keeps its Prettier formatting.
- Do not hand-edit `CHANGELOG.md` or `.release-please-manifest.json`, and do not bump `package.json`'s `version` by hand. release-please updates them in its release PR.
- Do not hand-edit `skills/design-system-axi/SKILL.md`. It is generated from `src/skill.ts`; run `pnpm run build:skill` and commit the result.
- Tests never hit the network. A new source adapter needs fixtures captured from real data and a drift test that expects `MANIFEST_SHAPE`.
- A change to `find` ranking, tokenization, or synonyms includes a before/after `pnpm run eval` entry in `eval/LOG.md`. Never edit a registered task in `eval/tasks.json`.

## Questions

Open an issue.
