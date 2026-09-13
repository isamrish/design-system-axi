import { parseArgs } from "node:util";
import { validationError } from "./errors.js";

export type FlagSpec = Record<string, { type: "string" | "boolean" }>;

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean | undefined>;
}

export function parseCommandArgs(
  command: string,
  args: string[],
  options: FlagSpec,
): ParsedArgs {
  try {
    const { values, positionals } = parseArgs({
      args,
      options,
      allowPositionals: true,
      strict: true,
    });
    return { positionals, flags: { ...values } };
  } catch (error) {
    throw validationError(
      error instanceof Error ? error.message : String(error),
      command,
    );
  }
}

export function intFlag(
  command: string,
  name: string,
  value: string | boolean | undefined,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw validationError(`--${name} must be a positive integer`, command);
  }
  return parsed;
}
