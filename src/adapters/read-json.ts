import { readFile } from 'node:fs/promises';
import { sourceUnreachable } from '../errors.js';

export function isUrl(location: string): boolean {
  return /^https?:\/\//i.test(location);
}

/** `hint` is the adapter-specific next step shown when the source cannot be read. */
export async function readJson(
  location: string,
  hint: string,
): Promise<unknown> {
  const text = isUrl(location)
    ? await fetchText(location, hint)
    : await readText(location, hint);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw sourceUnreachable(location, 'not JSON', hint);
  }
}

async function fetchText(url: string, hint: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    throw sourceUnreachable(
      url,
      error instanceof Error ? error.message : String(error),
      hint,
    );
  }
  if (!response.ok)
    throw sourceUnreachable(url, `HTTP ${response.status}`, hint);
  try {
    return await response.text();
  } catch (error) {
    throw sourceUnreachable(
      url,
      error instanceof Error ? error.message : String(error),
      hint,
    );
  }
}

async function readText(path: string, hint: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw sourceUnreachable(
      path,
      code === 'ENOENT' ? 'file not found' : String(code ?? error),
      hint,
    );
  }
}
