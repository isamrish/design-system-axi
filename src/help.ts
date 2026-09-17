export const DESCRIPTION =
  'Look up components, props, and usage in your design system';

export const TOP_LEVEL_HELP = `usage: design-system-axi <command> [args] [flags]
commands:
  (no command)        design system, catalog status, component counts
  components          list components [--status <s>] [--limit <n>]
  component <Name>    props, import, and an example [--id] [--full]
  find "<intent>"     rank components for what you are building [--limit <n>]
  sync                build the local catalog [--storybook <url|dir>] [--primer <dir>] [--catalog <path>] [--full]
  setup hooks         start agent sessions with design system context [--user]
`;

const COMMAND_HELP: Record<string, string> = {
  components: `usage: design-system-axi components [--status <s>] [--limit <n>]
Lists components as name, status, and import source. Deprecated components are excluded unless --status deprecated.
flags:
  --status <s>   one of stable, beta, alpha, draft, deprecated, unknown
  --limit <n>    maximum rows (default 100)
`,
  component: `usage: design-system-axi component <Name> [--id] [--full]
Shows status, import, props, an example, subcomponents, and related components. Accepts Parent.Sub for subcomponents.
Props are the documented props from the sources; inherited props and HTML attributes may be missing, so check the component's types before assuming a prop is unsupported.
flags:
  --id     treat the argument as a component id (to reach duplicates such as a deprecated Dialog)
  --full   show every prop with descriptions and every example
`,
  find: `usage: design-system-axi find "<intent>" [--limit <n>]
Ranks components for what you are building, with the evidence for each match.
match: strong when a word from the intent appears in the component name, a subcomponent name, or its description; weak otherwise (confirm weak matches with component <Name>).
flags:
  --limit <n>    maximum matches (default 5)
`,
  sync: `usage: design-system-axi sync [--storybook <url|dir>] [--primer <dir>] [--catalog <path>] [--full]
Reads sources and writes the catalog to .design-system-axi/catalog.json.
Sources come from flags, then DESIGN_SYSTEM_AXI_STORYBOOK / DESIGN_SYSTEM_AXI_PRIMER, then design-system.axi.json.
flags:
  --storybook <url|dir>   Storybook URL or built Storybook directory (needs features.componentsManifest)
  --primer <dir>          directory with generated/components.json, e.g. node_modules/@primer/react
  --catalog <path>        catalog output path
  --full                  name every skipped entry instead of the first 5
Entries that are not components, such as hooks and story groups that join nothing, are reported by adapter key under skipped.
`,
  setup: `usage: design-system-axi setup hooks [--user]
Installs a session-start hook that runs design-system-axi, so agents start with the design system context.
flags:
  --user   install for your user instead of this project
`,
};

export function getCommandHelp(command: string): string | undefined {
  return COMMAND_HELP[command];
}
