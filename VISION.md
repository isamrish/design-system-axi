# Vision

`design-system-axi` exists so that an agent writing UI builds with the design system instead of around it.
It serves coding agents first and the people who maintain design systems second, and it turns Storybook manifests and design-system metadata into one normalized, local catalog.
It owns exactly one thing: an accurate, compact answer to "which component, and how do I use it?"

## Accuracy is the first obligation

Every fact it reports - a component's status, import path, props, or example - comes from a source the design system publishes.
A deprecated component must never read as current, and a current component must never read as missing, because being wrong about the headline fact defeats the tool.
When two sources disagree, the design system's own curated metadata wins, and the catalog records which source supplied each field.

## It reports, the caller decides

design-system-axi publishes the vocabulary of a design system, and the agent decides what to build with it.
It never generates UI, never writes code into an app, and never edits a design system, its Storybook, or its metadata.
A derived signal is welcome when it is computed only from catalog facts, is documented, and is deterministic; `find` ships on exactly those terms and explains every ranking it makes.

## Absent data stays absent

It never invents a description, a prop, a default, a status, or a relationship between components.
An unknown status renders as `unknown`, a component without an example has an empty example, and a source it cannot parse is reported as `MANIFEST_SHAPE` rather than half-read.
A catalog that is out of date with the installed design system says so instead of passing as current.

## Deterministic and offline

Every command except `sync` answers from the local catalog, with the same output for the same catalog and arguments.
Ranking uses weighted field matching and a curated synonym list, never an LLM or embeddings, and every change to it is measured against a pre-registered evaluation before it lands.

## Fixes land as machinery

A source's shape is understood in exactly one translation module, and the catalog is the one contract every command reads.
A published shape change is deliberate and versioned, with the schema bump and its documentation in the same change.
A new design system or source arrives as an adapter that emits the same fragments, never as special cases inside commands.

## The output is a budget

Default output is compact because its reader is an agent that pays per token to parse it.
Every field earns its place, lists are capped with a stated total, and `--full` is the explicit escape hatch.

## Scope

design-system-axi is not a component generator, not a Storybook replacement, not a design tool, not a linter for app code, and not a hosted service.
Design tokens, guidance documentation, patterns, and rules are welcome as further sources of the same catalog when they can be read accurately from what a design system publishes.

A change aligns when it makes a real design-system fact readable that was previously unreadable or wrong, keeps output deterministic and compact, and leaves the decision with the agent.
A change should be resisted when it invents facts no source publishes, needs the network or a model to answer a read command, writes to a design system or an app, or grows the surface into a product this is not.
