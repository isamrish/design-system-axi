---
name: design-system-axi
description: "Look up the app's design system via the design-system-axi CLI - which components exist, their status, import path, props, and known-good examples, plus components ranked with evidence for what you are building, read from a local catalog synced from Storybook and design-system metadata. Use before writing or changing UI, when choosing which component to use, or when checking a component's props, import, or deprecation."
user-invocable: false
author: Amrish Kushwaha (isamrish)
metadata:
  hermes:
    tags:
      - design-system
      - components
      - storybook
      - ui
      - react
      - cli
    category: development
---

# design-system-axi

Look up the app's design system: which components exist, their status, import path, props, and known-good examples.
design-system-axi reads a local catalog synced from Storybook and design-system metadata. It never generates UI
and never modifies the design system.

Use it before writing or changing UI, when choosing which component fits what you are building, or when checking
a component's props, import path, or deprecation.

For current instructions, output shape, and field semantics, run the CLI (no global install required):

- `npx -y design-system-axi` - design system, catalog status, and component counts
- `npx -y design-system-axi find "<what you are building>"` - components ranked with evidence
- `npx -y design-system-axi --help` - commands and flags
