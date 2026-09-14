// Trigger string agents match against to auto-load the skill.
// Kept terse and outcome-focused so it fires on "which component / how do I use it" intents.
export const SKILL_DESCRIPTION =
  "Look up the app's design system via the design-system-axi CLI - which components exist, their status, " +
  'import path, props, and known-good examples, plus components ranked with evidence for what you are building, ' +
  'read from a local catalog synced from Storybook and design-system metadata. Use before writing or changing UI, ' +
  "when choosing which component to use, or when checking a component's props, import, or deprecation.";

export const SKILL_AUTHOR = 'Amrish Kushwaha (isamrish)';

// Extended frontmatter read by Nous Research's Hermes Agent harness
// (https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).
// Harnesses that don't know these fields (e.g. Claude Code) ignore them.
export const HERMES_TAGS = [
  'design-system',
  'components',
  'storybook',
  'ui',
  'react',
  'cli',
];
export const HERMES_CATEGORY = 'development';

function yamlStringList(values: string[], indent: string): string {
  return values.map(value => `${indent}- ${value}`).join('\n');
}

/**
 * Render the installable SKILL.md as a minimal stub. The CLI output is the single
 * source of truth - never bake help text, output schema, or field semantics here.
 */
export function createSkillMarkdown(): string {
  return `---
name: design-system-axi
description: ${JSON.stringify(SKILL_DESCRIPTION)}
user-invocable: false
author: ${SKILL_AUTHOR}
metadata:
  hermes:
    tags:
${yamlStringList(HERMES_TAGS, '      ')}
    category: ${HERMES_CATEGORY}
---

# design-system-axi

Look up the app's design system: which components exist, their status, import path, props, and known-good examples.
design-system-axi reads a local catalog synced from Storybook and design-system metadata. It never generates UI
and never modifies the design system.

Use it before writing or changing UI, when choosing which component fits what you are building, or when checking
a component's props, import path, or deprecation.

For current instructions, output shape, and field semantics, run the CLI (no global install required):

- \`npx -y design-system-axi\` - design system, catalog status, and component counts
- \`npx -y design-system-axi find "<what you are building>"\` - components ranked with evidence
- \`npx -y design-system-axi --help\` - commands and flags
`;
}
