# Primer: the CLI against no CLI, packages installed

Added after the Gutenberg runs in `../gutenberg/`, to check whether the CLI's measured effect there holds on a
design system the model knows well. Six separate Claude Sonnet agents, 3 per arm, each in its own clone of a Vite +
React + TypeScript app with `@primer/react` 38.39.0 installed. Expected components and scoring were recorded before
any agent ran (`expected.md`).

- **d1-d3 (no CLI):** the task only.
- **e1-e3 (CLI):** the same task, plus the released design-system-axi 0.1.6, a catalog synced from
  https://primer.style/react/storybook and the installed package, its session hook output, and the sentence telling
  the agent to use the CLI via `npx design-system-axi <args>`. A wrapper logged every CLI call (`calls/`).

Task: `src/RepositoryPage.tsx` with a dismissible "archived" message, a title area with name, description, and
Star/Fork actions, Code/Issues/Pull requests navigation, an empty state with a create button, and a deployments table.
Each item has a trap: a deprecated component that still ships (`Flash`, `Pagehead`, `TabNav`, the old `UnderlineNav`)
or an import path that only works from `@primer/react/experimental` (`Blankslate`, `DataTable`). Agents had to pass
`tsc --noEmit`; `typecheck.txt` is a separate run after they finished.

Effort, from each agent's own usage report:

| run | tool calls | tokens  | time  | CLI calls |
| --- | ---------- | ------- | ----- | --------- |
| d1  | 39         | 109,362 | 212 s | -         |
| d2  | 29         | 98,518  | 161 s | -         |
| d3  | 34         | 114,519 | 248 s | -         |
| e1  | 33         | 118,546 | 189 s | 23        |
| e2  | 21         | 141,985 | 100 s | 12        |
| e3  | 30         | 99,062  | 204 s | 25        |

By their own reports, d2 and d3 read `node_modules/@primer/react/generated/components.json` (the curated metadata
design-system-axi also reads), and d1 read the `@deprecated` notes in the package's type declarations.

`outputs/` holds each agent's file verbatim; `score.ts` scores them against `deprecated.json`, the catalog's
deprecated entries.
