# Live agent tests, 2026-09-17

Separate Claude Sonnet agents each built a small UI in their own app directory. Every agent got the same task
text; conditions differ only as described below. `design-system-axi` was replaced by a wrapper that logged each
call before running the real CLI, so `calls/` records what agents ran rather than what they reported.
Expected components were written down before any agent ran (`expected.md`). See `eval/LOG.md` for results.

## Primer (`primer/`, 1 run per arm)

App: a clone of a Vite + React app with `@primer/react` 38.39.0 installed, catalog synced from
https://primer.style/react/storybook and the installed package. Task: `src/RepoSettingsPage.tsx` with an email
notifications toggle, a dismissible maintenance notice, a Preview/Code switch, an empty state with a create
button, and a "..." actions menu; it had to pass `tsc --noEmit`.

- **arm-a**: CLI from the unmerged components-first guidance branch; session hook says "Run components to choose a component before writing UI".
- **arm-b**: released 0.1.6; session hook says "Run find before writing UI".

## Gutenberg (`gutenberg/`, 3 runs per condition)

App: an empty React app whose `package.json` lists `@wordpress/components`, `@wordpress/ui`, and
`@wordpress/dataviews`. Task: `src/PluginSettings.tsx` with an expandable "Advanced settings" section, a no-results
message with an illustration, an API key field with label and help text, a colored connection-status label, and
an inline validity message under the key field.

| runs  | CLI             | catalog                                 | packages installed                                           | session hook context         |
| ----- | --------------- | --------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| a1-a3 | guidance branch | Gutenberg Storybook snapshot 2026-09-16 | no                                                           | "Run components to choose…"  |
| b1-b3 | released 0.1.6  | same                                    | no                                                           | "Run find before writing UI" |
| c1-c3 | none            | none                                    | no                                                           | none                         |
| d1-d3 | none            | none                                    | yes (`@wordpress/ui` 0.22.0, `@wordpress/components` 40.1.0) | none                         |
| e1-e3 | released 0.1.6  | same as a/b                             | yes, as d1-d3                                                | "Run find before writing UI" |

CLI runs were told to use the CLI via `npx design-system-axi <args>`; runs without it were given the same task
with that sentence and the hook context removed. e1-e3 were added after the other runs to separate the CLI from package availability: they are d1-d3 plus the CLI, catalog, and hook. Agents were not asked to type-check; afterwards every output was type-checked against the installed packages in one shared project (`typecheck.txt`). `score.ts` scores imports:
**strict** counts the design system's current documented component per item, **valid** any component the
published packages export (`published-exports.json`) that serves the item, imported from the package that
exports it; it also lists imported names the packages do not export.

`outputs/` holds each agent's file verbatim.

## Primer, CLI against no CLI (`primer-cli-comparison/`, 3 runs per arm)

Added after the Gutenberg runs to check the CLI's effect on a design system the model knows well; see that folder's README.
