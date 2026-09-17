<h1 align="center">design-system-axi</h1>

<h3 align="center">Your agent should build with your design system, not around it</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/design-system-axi"><img alt="npm" src="https://img.shields.io/npm/v/design-system-axi?style=flat-square" /></a>
  <a href="https://github.com/isamrish/design-system-axi/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/isamrish/design-system-axi/ci.yml?style=flat-square&label=ci" /></a>
  <a href="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square"><img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square" /></a>
</p>

Design system CLI for agents - designed with [AXI](https://axi.md) (Agent eXperience Interface).

Design systems were designed for humans: documentation sites, Storybook pages, and Figma files.
An agent writing UI needs something else - which component to use, how to import it, which props it takes, and a known-good example - in a few hundred tokens.

design-system-axi syncs your Storybook components manifest and design-system metadata into one local catalog and answers from it.

- **Deterministic** - `find` ranks components with weighted field matching and a small curated synonym list, says why each match ranked, and marks matches `strong` or `weak`. No LLM, no embeddings.
- **Local first** - every command except `sync` answers offline from `.design-system-axi/catalog.json`.
- **Token efficient** - default output is compact TOON with capped fields; `--full` shows everything.

## Quick Start

```sh
npm install @primer/react
npx -y design-system-axi sync --storybook https://primer.style/react/storybook --primer node_modules/@primer/react
npx -y design-system-axi find "confirm before deleting a repository"
npx -y design-system-axi component ConfirmationDialog
```

## Install

design-system-axi requires Node.js 20 or newer.

**Agent skill (recommended)**

Install the skill in the [Agent Skills](https://agentskills.io) format with [`npx skills`](https://github.com/vercel-labs/skills):

```sh
npx skills add isamrish/design-system-axi --skill design-system-axi -g
```

The minimal skill points your agent to the live CLI through `npx -y design-system-axi`, so installed skill copies never duplicate changing CLI instructions.
`-g` installs the skill for all projects; drop it to install for the current project only.

**Session context**

```sh
npm install -g design-system-axi
design-system-axi setup hooks
```

New Claude Code, Codex, and OpenCode sessions in the project then start with the design-system-axi home view.

**From source**

```sh
git clone https://github.com/isamrish/design-system-axi.git
cd design-system-axi
pnpm install
pnpm run build
pnpm run dev
```

## Agent Skill

The npm package includes `skills/design-system-axi/SKILL.md`, the same installable skill recommended above.
It is generated from `src/skill.ts`; update it with `pnpm run build:skill` and verify it with `pnpm run build:skill -- --check`.

## How It Works

```
┌──────────────────┐     ┌─────────────────────────┐
│ Storybook        │     │ design-system metadata  │
│ components.json  │     │ (Primer components.json)│
└────────┬─────────┘     └────────────┬────────────┘
         ▼                            ▼
┌───────────────────────────────────────────────────┐
│ sync: adapters → join by story id → validate      │
└────────────────────────┬──────────────────────────┘
                         ▼
┌───────────────────────────────────────────────────┐
│ .design-system-axi/catalog.json (schemaVersion 1) │
└────────────────────────┬──────────────────────────┘
                         ▼
┌───────────────────────────────────────────────────┐
│ home · components · component · find  (offline)   │
└───────────────────────────────────────────────────┘
```

- **Sources are read, never written** - Storybook ≥ 10 with `features: { componentsManifest: true }` (a URL or a `storybook build` directory) supplies components, stories, snippets, and descriptions; a directory with `generated/components.json` (shipped in `@primer/react`) supplies curated status, import paths, props, and subcomponents.
- **Merged by story id** - sources are joined on Storybook story ids; the design system's own metadata wins where both report a field, and the catalog records which source supplied each field.
- **Version aware** - the home view compares the catalog's design-system version with the version installed in your app.
- **Measured with live agents** - on a WordPress plugin screen with its packages installed, agents using the CLI picked the design system's documented current components in 15 of 15 choices against 11 of 15 without it, with fewer tool calls (median 16 against 21); every file type-checked either way. Without the packages, all three files written from memory failed to type-check, while all six written with the CLI passed. These are small samples (3-6 runs per condition, one model); see the live agent tests in [`eval/LOG.md`](eval/LOG.md).
- **`find` is a shortlist, not an oracle** - it is keyword-based: it finds components whose names or descriptions share your words and misses paraphrases. On held-out tasks it puts a correct component in the top 3 a little over half the time: 55% against Primer React and 60% against WordPress Gutenberg's Storybook (20 tasks each; see [`eval/LOG.md`](eval/LOG.md)). Treat `weak` matches with suspicion and confirm with `component <Name>`.

## CLI Reference

| Command                                                             | Description                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `design-system-axi`                                                 | Design system, catalog freshness, installed-version match, component counts |
| `components [--status <s>] [--limit <n>]`                           | Components with status and import source                                    |
| `component <Name> [--id] [--full]`                                  | Status, import, props, an example, subcomponents, related components        |
| `find "<intent>" [--limit <n>]`                                     | Components ranked for what you are building, with evidence                  |
| `sync [--storybook <url\|dir>] [--primer <dir>] [--catalog <path>]` | Build `.design-system-axi/catalog.json` from your sources                   |
| `setup hooks [--user]`                                              | Start agent sessions with the home view                                     |
| `update`                                                            | Upgrade design-system-axi to the latest published version                   |

Every command accepts `--help`. Errors carry a stable `code`: `VALIDATION_ERROR` (exit 2), `NO_CATALOG`, `NOT_FOUND`, `SOURCE_UNREACHABLE`, `MANIFEST_SHAPE`, and `CATALOG_INVALID` (exit 1).

### Configuration

Sources can live in `design-system.axi.json` at your project root:

```json
{
  "sources": [
    {
      "adapter": "storybook",
      "location": "https://primer.style/react/storybook"
    },
    {
      "adapter": "primer-components-json",
      "location": "node_modules/@primer/react"
    }
  ]
}
```

Flags override `DESIGN_SYSTEM_AXI_STORYBOOK`, `DESIGN_SYSTEM_AXI_PRIMER`, and `DESIGN_SYSTEM_AXI_CATALOG`, which override the file.

Commands work from any subdirectory: they use the nearest `.design-system-axi/catalog.json` or `design-system.axi.json` above the current directory, like git.

## Development

```sh
pnpm install                    # Install dependencies
pnpm run build                  # Compile TypeScript to dist/
pnpm run typecheck              # Type-check sources, tests, and scripts
pnpm run lint                   # Run ESLint
pnpm run format:check           # Check Prettier formatting
pnpm test                       # Build, then run the offline test suite
pnpm run build:skill -- --check # Verify the generated skill is current
pnpm run eval                   # Score find against the pre-registered tasks
pnpm run dev                    # Run the CLI with tsx
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, generated-file rules, and release-please conventions.

## License

MIT
