import {
  type InstallSessionStartHooksOptions,
  type SessionStartHookScope,
  type SessionStartHookStatus,
  type SessionStartHookStatusOptions,
  installSessionStartHooks,
  sessionStartHookStatus,
} from "axi-sdk-js";
import { parseCommandArgs } from "../args.js";
import { BIN, validationError } from "../errors.js";
import type { CommandContext } from "./context.js";

export interface SetupDeps {
  install(options: InstallSessionStartHooksOptions): void;
  status(options: SessionStartHookStatusOptions): SessionStartHookStatus;
}

const FLAGS = { user: { type: "boolean" } } as const;
const USAGE = "usage: design-system-axi setup hooks [--user]";

const defaultDeps: SetupDeps = {
  install: installSessionStartHooks,
  status: sessionStartHookStatus,
};

export async function setupCommand(
  args: string[],
  ctx: CommandContext,
  deps: SetupDeps = defaultDeps,
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseCommandArgs("setup", args, FLAGS);
  if (positionals.length !== 1 || positionals[0] !== "hooks")
    throw validationError(USAGE, "setup");

  const scope: SessionStartHookScope = flags.user === true ? "user" : "project";
  const scopeOptions: { scope: SessionStartHookScope; projectDir?: string } =
    scope === "project" ? { scope, projectDir: ctx.cwd } : { scope };
  const errors: string[] = [];
  deps.install({
    ...scopeOptions,
    marker: BIN,
    onError: (message) => errors.push(message),
  });
  const status = deps.status({ ...scopeOptions, marker: BIN });

  const label = (installed: boolean) =>
    installed ? "installed" : "not installed";
  const output: Record<string, unknown> = {
    scope,
    hooks: {
      claude: label(status.claude.installed),
      codex: label(status.codex.installed),
      opencode: label(status.opencode.installed),
    },
  };
  if (
    !status.claude.installed &&
    !status.codex.installed &&
    !status.opencode.installed
  ) {
    output.note = `hooks install only from the installed binary; run \`npm install -g ${BIN}\`, then \`${BIN} setup hooks\``;
  }
  if (errors.length > 0) output.errors = errors;
  output.help = [
    `New agent sessions${scope === "project" ? " in this project" : ""} start with \`${BIN}\` output`,
    `Run \`${BIN} sync\` so that output includes the catalog`,
  ];
  return output;
}
