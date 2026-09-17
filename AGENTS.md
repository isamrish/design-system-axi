# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- [VISION.md](VISION.md) is the project's acceptance policy; check a proposed surface against its closing aligns/resisted tests before building it.
- design-system-axi reads a design system and reports it. It never generates UI, never writes to a design system or its Storybook, and never calls an LLM or embedding service.
- Network access happens only in `sync` (reading configured sources) and the SDK's built-in `update`. Every other command answers from `.design-system-axi/catalog.json`, offline and deterministically. Tests never hit the network; `scripts/smoke.sh` is the only live check and is not part of CI.
- The catalog shape is a public contract defined once in `src/catalog/schema.ts` (`schemaVersion: 1`). A shape change is deliberate: bump `CATALOG_SCHEMA_VERSION`, document it in README, and keep `readCatalog`'s newer-version error. Empty values are `""`/`[]`, never absent, so TOON tables stay uniform.
- Source shapes stay inside each adapter's `translate.ts`. Storybook's components manifest is a preview schema, not a stable API, and it has one entry per stories file rather than per component. Validate only the fields read, and throw `MANIFEST_SHAPE` with the JSON path instead of returning partial data.
- `src/catalog/merge.ts` owns cross-source joining: story id first, then id prefix (non-distinct sources only), then a unique name, preferring the single non-deprecated match. A deprecated entry (a `Deprecated/` sidebar story, whose id starts `deprecated-`) joins a current component only by story id; by prefix or name it joins only a deprecated one, and it is skipped when it would otherwise shadow a current component of the same name. Current entries are placed first, so a story id claimed by both goes to the current component. A distinct-entries source (Primer) never merges two of its own entries, because duplicate names such as a deprecated and a current `Dialog` are real. Higher-priority sources win each field, and `provenance` records which source supplied it.
- Read commands (`home`, `components`, `component`, `find`) must not import `adapters/`, `config/`, or `catalog/merge`; only `src/commands/sync.ts` does.
- Command handlers return plain objects and `runAxiCli` renders TOON. Errors come from the factories in `src/errors.ts`; their `code` strings are public. `VALIDATION_ERROR` exits 2 and every other error exits 1.
- `bin/design-system-axi.ts` answers bare version flags through `axi-sdk-js/fast-path` with the leaf `src/version.ts` (node builtins only) and imports `src/cli.js` dynamically. Keep `src/version.ts` leaf-clean. The built entry must stay at `dist/bin/design-system-axi.js` so `installSessionStartHooks` recognizes an installed binary.
- The session hook runs the bare command, so the home view is the ambient context: keep it short, and keep its no-catalog state at exit 0.
- `find` is scored in `src/search/rank.ts` with curated synonyms in `src/search/synonyms.ts`. Registrations in `eval/tasks*.json` are never edited; every ranking, tokenizer, or synonym change is logged in `eval/LOG.md` with before/after `pnpm run eval` retrieval. Registration 1 is in-sample and gates CI at 85%; later registrations are held-out measurements, and a set whose results informed a change stops counting as held-out, so register a new set before claiming a clean number. Do not add words to synonym groups solely to pass a specific task.
- `test/fixtures/primer/` holds real Primer data (the Storybook manifest from https://primer.style/react/storybook and `@primer/react@38.39.0` metadata), and `test/fixtures/wordpress/` WordPress Gutenberg's full Storybook manifest (fetched 2026-09-16, no curated metadata). `eval/design-systems.ts` maps each registration's `designSystem` to its fixture, so every set is scored against its own catalog; refreshing a fixture a registration names means registering a new set. Counts and names asserted in tests are pinned to the committed files; `scripts/refresh-fixtures.sh` recreates both, and a refresh updates those expectations in the same change.
- A Storybook entry named `Tabs.Root` is catalogued as `Tabs`, with the entry itself as the first subcomponent and `import { Tabs } from "<package>"` synthesized from the statement that imported `Root`; a subcomponent key already carrying the root (`SubNav.Link`) is not qualified twice. Without this, every compound component in a design system is dropped as a non-component.
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

Releases run entirely in `.github/workflows/release-please.yml`. On every push to `main`, the `release-please` job opens or updates the release PR from conventional commit messages; merging that PR creates the tag and GitHub release, and the `publish` job then runs `npm publish --provenance` from the tag using npm's OIDC trusted-publisher flow (`id-token: write`). The trusted publisher is bound to that workflow file name, so publishing must stay in it.
OIDC token exchange is currently rejected for this repository (`OIDC token exchange error - package not found`, npm/cli#9969, likely GitHub's immutable OIDC subject format for repositories created after 2026-07-15), so the publish step also passes `NODE_AUTH_TOKEN` from the `NPM_TOKEN` secret: a granular token scoped to `design-system-axi` with bypass 2FA and a short expiry. npm tries OIDC first and uses the token only when the exchange fails. When npm/cli#9969 is resolved, delete the secret and the token, and restore the package setting that disallows bypass-2FA tokens; the workflow needs no change. When the token expires, a publish fails with an auth error until it is replaced or the fallback is removed.
If a release's publish did not complete, run the workflow manually (Actions → release-please → Run workflow) with the release tag, e.g. `design-system-axi-v0.1.1`; the `publish` job checks the tag matches `package.json` and skips versions already on npm.
`.release-please-manifest.json` was primed at `0.1.0`, published by hand before release-please took over, and `bootstrap-sha` in `release-please-config.json` points at that commit; release-please owns every version after that.
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
