import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { BIN, catalogInvalid, noCatalog } from "../errors.js";
import { type LocateContext, resolveCatalogPath } from "./locate.js";
import {
  CATALOG_SCHEMA_VERSION,
  type Catalog,
  CatalogSchema,
} from "./schema.js";

export async function readCatalog(path: string): Promise<Catalog | undefined> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === "ENOENT") return undefined;
    throw catalogInvalid(
      `cannot read catalog at ${path} (${errno.code ?? errno.message})`,
      `Run \`${BIN} sync\``,
    );
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw invalid(path);
  }
  const version = (data as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (typeof version === "number" && version > CATALOG_SCHEMA_VERSION) {
    throw catalogInvalid(
      `catalog schemaVersion ${version} is newer than supported ${CATALOG_SCHEMA_VERSION}`,
      `Run \`${BIN} update\``,
    );
  }
  const result = CatalogSchema.safeParse(data);
  if (!result.success) throw invalid(path);
  return result.data;
}

export async function writeCatalog(
  path: string,
  catalog: Catalog,
): Promise<void> {
  const valid = CatalogSchema.parse(catalog);
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(valid, null, 2)}\n`, "utf8");
  await rename(temp, path);
}

export async function requireCatalog(
  ctx: LocateContext,
): Promise<{ path: string; catalog: Catalog }> {
  const path = resolveCatalogPath(ctx);
  const catalog = await readCatalog(path);
  if (!catalog) throw noCatalog(path);
  return { path, catalog };
}

function invalid(path: string) {
  return catalogInvalid(`catalog at ${path} is invalid`, `Run \`${BIN} sync\``);
}
