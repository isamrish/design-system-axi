import { join } from "node:path";
import { parseOrThrow } from "../parse.js";
import { readJson } from "../read-json.js";
import type { SourceFragment } from "../types.js";
import { PackageJsonSchema, translatePrimer } from "./translate.js";

export async function loadPrimer(dir: string): Promise<SourceFragment> {
  const data = await readJson(join(dir, "generated", "components.json"));
  const pkg = parseOrThrow(
    PackageJsonSchema,
    await readJson(join(dir, "package.json")),
    "primer-components-json",
  );
  return translatePrimer(data, dir, { name: pkg.name, version: pkg.version });
}
