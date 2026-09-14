import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homeCommand } from "../../src/commands/home.js";
import { runCli } from "../helpers/cli.js";
import {
  makeCatalog,
  makeComponent,
  writeProjectCatalog,
} from "../helpers/catalog.js";
import { tmpDir } from "../helpers/tmp.js";

const now = () => new Date("2026-09-13T12:00:00.000Z");
const catalog = makeCatalog([
  makeComponent({ id: "button", name: "Button" }),
  makeComponent({ id: "flash", name: "Flash", status: "deprecated" }),
]);

function installPackage(cwd: string, version: string) {
  const dir = join(cwd, "node_modules", "@acme", "ui");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "@acme/ui", version }),
  );
}

describe("homeCommand", () => {
  it("shows the design system, catalog, and counts", async () => {
    const cwd = tmpDir();
    await writeProjectCatalog(cwd, catalog);
    expect(await homeCommand({ cwd, env: {}, now })).toEqual({
      design_system: { name: "Acme UI", package: "@acme/ui", version: "3.4.1" },
      catalog: { synced: "2d ago", sources: "storybook" },
      components: { total: 2, alpha: 1, deprecated: 1 },
      help: [
        'Run `design-system-axi find "<what you are building>"` before writing UI',
        "Run `design-system-axi component <Name>` for props, import, and an example",
        "Run `design-system-axi components` to list components",
      ],
    });
  });

  it("reports a matching installed version", async () => {
    const cwd = tmpDir();
    await writeProjectCatalog(cwd, catalog);
    installPackage(cwd, "3.4.1");
    const output = await homeCommand({ cwd, env: {}, now });
    expect(output.installed).toBe("3.4.1 (matches)");
    expect(output.warning).toBeUndefined();
  });

  it("warns about a version mismatch", async () => {
    const cwd = tmpDir();
    await writeProjectCatalog(cwd, catalog);
    installPackage(cwd, "3.0.0");
    const output = await homeCommand({ cwd, env: {}, now });
    expect(output.installed).toBe("3.0.0 (mismatch)");
    expect(output.warning).toBe(
      "catalog is 3.4.1 but the app has 3.0.0; run `design-system-axi sync`",
    );
  });

  it("shows a definitive empty state without a catalog", async () => {
    const cwd = tmpDir();
    expect(await homeCommand({ cwd, env: {}, now })).toEqual({
      catalog: `none at ${join(".design-system-axi", "catalog.json")}`,
      help: [
        "Run `design-system-axi sync --storybook <url|dir> --primer <dir>` to build the catalog",
        "Run `design-system-axi sync --help` for sources and design-system.axi.json",
      ],
    });
  });

  it("renders through the CLI with the SDK header", async () => {
    const cwd = tmpDir();
    await writeProjectCatalog(cwd, catalog);
    const result = await runCli([], { cwd, env: {}, now });
    expect(result.code).toBe(0);
    expect(result.out).toContain(
      'description: "Look up components, props, and usage in your design system"',
    );
    expect(result.out).toContain("design_system:");
    expect(result.out).toContain("synced: 2d ago");
  });
});
