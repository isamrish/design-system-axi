import { join } from "node:path";
import { isUrl, readJson } from "../read-json.js";
import type { SourceFragment } from "../types.js";
import { translateStorybook } from "./translate.js";

export function storybookManifestLocation(source: string): string {
  return isUrl(source)
    ? `${source.replace(/\/+$/, "")}/manifests/components.json`
    : join(source, "manifests", "components.json");
}

export async function loadStorybook(source: string): Promise<SourceFragment> {
  return translateStorybook(
    await readJson(storybookManifestLocation(source)),
    source,
  );
}
