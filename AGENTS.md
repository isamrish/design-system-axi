# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- [VISION.md](VISION.md) is the project's acceptance policy; check a proposed surface against its closing aligns/resisted tests before building it.
- design-system-axi reads a design system and reports it. It never generates UI, never writes to a design system or its Storybook, and never calls an LLM or embedding service.
- Network access happens only in `sync` (reading configured sources) and the SDK's built-in `update`. Every other command answers from `.design-system-axi/catalog.json`, offline and deterministically. Tests never hit the network; `scripts/smoke.sh` is the only live check and is not part of CI.
- The catalog shape is a public contract defined once in `src/catalog/schema.ts` (`schemaVersion: 1`). A shape change is deliberate: bump `CATALOG_SCHEMA_VERSION`, document it in README, and keep `readCatalog`'s newer-version error. Empty values are `""`/`[]`, never absent, so TOON tables stay uniform.
- Source shapes stay inside each adapter's `translate.ts`. Storybook's components manifest is a preview schema, not a stable API, and it has one entry per stories file rather than per component. Validate only the fields read, and throw `MANIFEST_SHAPE` with the JSON path instead of returning partial data.
- `src/catalog/merge.ts` owns cross-source joining: story id first, then id prefix (non-distinct sources only), then a unique name, preferring the single non-deprecated match. A distinct-entries source (Primer) never merges two of its own entries, because duplicate names such as a deprecated and a current `Dialog` are real. Higher-priority sources win each field, and `provenance` records which source supplied it.
- Read commands (`home`, `components`, `component`, `find`) must not import `adapters/`, `config/`, or `catalog/merge`; only `src/commands/sync.ts` does.
- Command handlers return plain objects and `runAxiCli` renders TOON. Errors come from the factories in `src/errors.ts`; their `code` strings are public. `VALIDATION_ERROR` exits 2 and every other error exits 1.
- `bin/design-system-axi.ts` answers bare version flags through `axi-sdk-js/fast-path` with the leaf `src/version.ts` (node builtins only) and imports `src/cli.js` dynamically. Keep `src/version.ts` leaf-clean. The built entry must stay at `dist/bin/design-system-axi.js` so `installSessionStartHooks` recognizes an installed binary.
- The session hook runs the bare command, so the home view is the ambient context: keep it short, and keep its no-catalog state at exit 0.
- `find` is scored in `src/search/rank.ts` with curated synonyms in `src/search/synonyms.ts`. Registrations in `eval/tasks.json` are never edited; every ranking, tokenizer, or synonym change is logged in `eval/LOG.md` with before/after `pnpm run eval` retrieval. Do not add words to synonym groups solely to pass a specific task.
- `test/fixtures/primer/` holds real Primer data (the Storybook manifest from https://primer.style/react/storybook and `@primer/react@38.39.0` metadata). Counts asserted in tests are pinned to the committed files; `scripts/refresh-fixtures.sh` recreates them, and a refresh updates those counts in the same change.
- The shipped skill stays minimal and defers to the CLI. `src/skill.ts` generates `skills/design-system-axi/SKILL.md`; never restate CLI help or output shapes in it.

## Development

```sh
pnpm install
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm test
pnpm run build:skill -- --check
pnpm run eval
```

## Release process

Releases are cut by release-please from conventional commit messages on `main`; merging the bot's release PR triggers `npm publish --provenance` via `.github/workflows/release-please.yml`, using npm's OIDC trusted-publisher flow (`id-token: write`), not an `NPM_TOKEN` secret.
`.release-please-manifest.json` is primed at `0.1.0`, the version published to npm by hand before release-please takes over. After that manual publish, set `bootstrap-sha` in `release-please-config.json` to the published commit; release-please owns every version after that.
Do not hand-edit `CHANGELOG.md` or `.release-please-manifest.json` (a guard workflow blocks PRs that touch them), do not bump `package.json`'s `version` by hand, and regenerate `skills/design-system-axi/SKILL.md` with `pnpm run build:skill` instead of editing it.
Every `pull_request` workflow must `paths-ignore` the release-please output set (`.release-please-manifest.json`, `CHANGELOG.md`, `package.json`).

## Lockfile formatting

The committed `pnpm-lock.yaml` is Prettier-formatted, which is not pnpm's native output format.
After changing dependencies, run `pnpm exec prettier --write pnpm-lock.yaml` so the diff collapses to the real change; CI's `pnpm install --frozen-lockfile` parses the YAML structurally and accepts this formatting.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
