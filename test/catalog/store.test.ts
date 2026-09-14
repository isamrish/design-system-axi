import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findConfigFile,
  resolveCatalogPath,
} from "../../src/catalog/locate.js";
import {
  readCatalog,
  requireCatalog,
  writeCatalog,
} from "../../src/catalog/store.js";
import { makeCatalog, makeComponent } from "../helpers/catalog.js";
import { tmpDir } from "../helpers/tmp.js";

describe("catalog location", () => {
  it("defaults to .design-system-axi/catalog.json in the working directory", () => {
    const cwd = tmpDir();
    expect(findConfigFile(cwd)).toBeUndefined();
    expect(resolveCatalogPath({ cwd, env: {} })).toBe(
      join(cwd, ".design-system-axi", "catalog.json"),
    );
  });

  it("anchors to the nearest design-system.axi.json", () => {
    const root = tmpDir();
    const nested = join(root, "apps", "web");
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(root, "design-system.axi.json"), "{}");
    expect(findConfigFile(nested)).toBe(join(root, "design-system.axi.json"));
    expect(resolveCatalogPath({ cwd: nested, env: {} })).toBe(
      join(root, ".design-system-axi", "catalog.json"),
    );
  });

  it("prefers the flag, then the environment variable", () => {
    const cwd = tmpDir();
    const env = { DESIGN_SYSTEM_AXI_CATALOG: "env/catalog.json" };
    expect(resolveCatalogPath({ cwd, env })).toBe(
      join(cwd, "env", "catalog.json"),
    );
    expect(resolveCatalogPath({ cwd, env }, "flag.json")).toBe(
      join(cwd, "flag.json"),
    );
  });
});

describe("catalog storage", () => {
  const catalog = makeCatalog([
    makeComponent({ id: "button", name: "Button" }),
  ]);

  it("round-trips a catalog and leaves no temp files", async () => {
    const dir = tmpDir();
    const path = join(dir, ".design-system-axi", "catalog.json");
    await writeCatalog(path, catalog);
    expect(await readCatalog(path)).toEqual(catalog);
    expect(readdirSync(join(dir, ".design-system-axi"))).toEqual([
      "catalog.json",
    ]);
  });

  it("returns undefined for a missing catalog", async () => {
    expect(await readCatalog(join(tmpDir(), "none.json"))).toBeUndefined();
  });

  it("rejects invalid and newer catalogs with CATALOG_INVALID", async () => {
    const dir = tmpDir();
    const broken = join(dir, "broken.json");
    writeFileSync(broken, "{not json");
    await expect(readCatalog(broken)).rejects.toMatchObject({
      code: "CATALOG_INVALID",
      message: `catalog at ${broken} is invalid`,
    });

    const newer = join(dir, "newer.json");
    writeFileSync(newer, JSON.stringify({ ...catalog, schemaVersion: 2 }));
    await expect(readCatalog(newer)).rejects.toMatchObject({
      code: "CATALOG_INVALID",
      message: "catalog schemaVersion 2 is newer than supported 1",
      suggestions: ["Run `design-system-axi update`"],
    });
  });

  it("requires a catalog for read commands", async () => {
    const cwd = tmpDir();
    await expect(requireCatalog({ cwd, env: {} })).rejects.toMatchObject({
      code: "NO_CATALOG",
      message: `no catalog at ${join(cwd, ".design-system-axi", "catalog.json")}`,
    });
    await writeCatalog(
      join(cwd, ".design-system-axi", "catalog.json"),
      catalog,
    );
    expect(
      (await requireCatalog({ cwd, env: {} })).catalog.components[0]?.name,
    ).toBe("Button");
  });
});
