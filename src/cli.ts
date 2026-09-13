import { runAxiCli } from "axi-sdk-js";
import {
  type CommandContext,
  type ContextDeps,
  createContext,
} from "./commands/context.js";
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
    home: () => ({ help: ["Run `design-system-axi --help`"] }),
    commands: {},
  });
}
