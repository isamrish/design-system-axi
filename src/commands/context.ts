export interface ContextDeps {
  cwd: string;
  env: NodeJS.ProcessEnv;
  now: () => Date;
}

export type CommandContext = ContextDeps;

export function createContext(
  overrides: Partial<ContextDeps> = {},
): CommandContext {
  return {
    cwd: overrides.cwd ?? process.cwd(),
    env: overrides.env ?? process.env,
    now: overrides.now ?? (() => new Date()),
  };
}
