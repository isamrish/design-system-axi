import { runAxiCli } from "axi-sdk-js";
import {
  type CommandContext,
  type ContextDeps,
  createContext,
} from "./commands/context.js";
import { componentCommand } from "./commands/component.js";
import { componentsCommand } from "./commands/components.js";
import { homeCommand } from "./commands/home.js";
import { syncCommand } from "./commands/sync.js";
import { DESCRIPTION, TOP_LEVEL_HELP, getCommandHelp } from "./help.js";
import { VERSION } from "./version.js";

export type MainOptions = Partial<ContextDeps> & {
  stdout?: { write: (chunk: string) => unknown };
};

export async function main(
  argv: string[] = process.argv.slice(2),
  options: MainOptions = {},
): Promise<void> {
  const { stdout, ...deps } = options;
  const context = createContext(deps);
  await runAxiCli<CommandContext>({
    description: DESCRIPTION,
    version: VERSION,
    argv,
    topLevelHelp: TOP_LEVEL_HELP,
    getCommandHelp,
    stdout,
    resolveContext: () => context,
    home: () => homeCommand(context),
    commands: {
      component: (args) => componentCommand(args, context),
      components: (args) => componentsCommand(args, context),
      sync: (args) => syncCommand(args, context),
    },
  });
}
