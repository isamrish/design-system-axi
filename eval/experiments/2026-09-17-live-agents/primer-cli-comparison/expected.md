Primer comparison: expected components, written before any agent ran.
App: Vite + React + TypeScript with @primer/react 38.39.0 installed; agents must pass `tsc --noEmit`.
Arms (3 runs each, same model): d = no CLI; e = released design-system-axi 0.1.6 with catalog, hook, and logging wrapper.

| #   | item                                                    | expected (current)  | import path                | traps                                                        |
| --- | ------------------------------------------------------- | ------------------- | -------------------------- | ------------------------------------------------------------ |
| 1   | dismissible message that the repository was archived    | Banner              | @primer/react              | Flash (deprecated; still compiles from @primer/react)        |
| 2   | page title area: repo name, description, action buttons | PageHeader          | @primer/react              | Pagehead (deprecated; only from @primer/react/deprecated)    |
| 3   | horizontal nav between Code, Issues, Pull requests      | UnderlineNav        | @primer/react              | TabNav, or UnderlineNav from @primer/react/deprecated        |
| 4   | empty state for no pull requests, with a create button  | Blankslate          | @primer/react/experimental | importing it from @primer/react does not compile             |
| 5   | table of recent deployments: environment, status, date  | DataTable (+ Table) | @primer/react/experimental | importing it from @primer/react does not compile; hand-built |

Scores per run: strict (expected component from its path), deprecated components used (any component the catalog lists
as deprecated, or anything imported from @primer/react/deprecated), passes tsc, and effort (tool calls, CLI calls, time, tokens).
