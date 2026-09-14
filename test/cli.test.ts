import { describe, expect, it } from "vitest";
import { VERSION } from "../src/version.js";
import { runCli } from "./helpers/cli.js";

describe("cli skeleton", () => {
  it("prints the version", async () => {
    const result = await runCli(["--version"]);
    expect(result.out).toBe(`${VERSION}\n`);
    expect(result.code).toBe(0);
  });

  it("prints top-level help", async () => {
    const result = await runCli(["--help"]);
    expect(result.out).toContain(
      "usage: design-system-axi <command> [args] [flags]",
    );
    expect(result.out).toContain('find "<intent>"');
  });

  it("prints per-command help", async () => {
    const result = await runCli(["find", "--help"]);
    expect(result.out).toContain(
      'usage: design-system-axi find "<intent>" [--limit <n>]',
    );
    expect(result.out).toContain("match: strong when");
  });

  it("rejects unknown commands", async () => {
    const result = await runCli(["nope"]);
    expect(result.out).toContain("code: VALIDATION_ERROR");
    expect(result.code).toBe(2);
  });
});
