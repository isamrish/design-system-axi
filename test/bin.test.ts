import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const tsx = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const version = (
  JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string }
).version;

describe("bin entry", () => {
  it("answers --version through the fast path", () => {
    expect(
      execFileSync(tsx, ["bin/design-system-axi.ts", "--version"], {
        cwd: root,
        encoding: "utf8",
      }),
    ).toBe(`${version}\n`);
  });

  it("falls through to the full CLI for other arguments", () => {
    const out = execFileSync(tsx, ["bin/design-system-axi.ts", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(out).toContain("usage: design-system-axi <command> [args] [flags]");
  });
});
