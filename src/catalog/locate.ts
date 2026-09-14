import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const CONFIG_FILE = "design-system.axi.json";
export const DEFAULT_CATALOG_PATH = join(".design-system-axi", "catalog.json");

export interface LocateContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export function findConfigFile(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    const candidate = join(dir, CONFIG_FILE);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function resolveCatalogPath(ctx: LocateContext, flag?: string): string {
  if (flag) return resolve(ctx.cwd, flag);
  const fromEnv = ctx.env.DESIGN_SYSTEM_AXI_CATALOG;
  if (fromEnv) return resolve(ctx.cwd, fromEnv);
  const config = findConfigFile(ctx.cwd);
  return resolve(config ? dirname(config) : ctx.cwd, DEFAULT_CATALOG_PATH);
}
