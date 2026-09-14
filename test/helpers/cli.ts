import { main, type MainOptions } from '../../src/cli.js';

export interface CliResult {
  out: string;
  code: number;
}

export async function runCli(
  argv: string[],
  options: Omit<MainOptions, 'stdout'> = {},
): Promise<CliResult> {
  let out = '';
  process.exitCode = undefined;
  await main(argv, {
    ...options,
    stdout: {
      write: (chunk: string) => {
        out += chunk;
        return true;
      },
    },
  });
  const code = typeof process.exitCode === 'number' ? process.exitCode : 0;
  process.exitCode = undefined;
  return { out, code };
}
