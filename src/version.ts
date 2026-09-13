import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Leaf module: node builtins only, so the bin fast path never loads the command graph.
export const VERSION = readPackageVersion();

function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/version.ts in development, dist/src/version.js when built.
  for (const candidate of [
    join(here, "..", "package.json"),
    join(here, "..", "..", "package.json"),
  ]) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf8")) as {
      version?: unknown;
    };
    if (typeof parsed.version === "string" && parsed.version.length > 0)
      return parsed.version;
  }
  return "0.0.0";
}
