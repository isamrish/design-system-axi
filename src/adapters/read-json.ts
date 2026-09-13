import { readFile } from "node:fs/promises";
import { sourceUnreachable } from "../errors.js";

export function isUrl(location: string): boolean {
  return /^https?:\/\//i.test(location);
}

export async function readJson(location: string): Promise<unknown> {
  const text = isUrl(location)
    ? await fetchText(location)
    : await readText(location);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw sourceUnreachable(location, "not JSON");
  }
}

async function fetchText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: { accept: "application/json" },
    });
  } catch (error) {
    throw sourceUnreachable(
      url,
      error instanceof Error ? error.message : String(error),
    );
  }
  if (!response.ok) throw sourceUnreachable(url, `HTTP ${response.status}`);
  return response.text();
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw sourceUnreachable(
      path,
      code === "ENOENT" ? "file not found" : String(code ?? error),
    );
  }
}
