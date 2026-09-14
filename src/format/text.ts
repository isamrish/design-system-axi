import { isAbsolute, relative } from 'node:path';

export function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function importSource(statement: string): string {
  return statement.match(/from\s+["']([^"']+)["']/)?.[1] ?? '';
}

export function displayPath(cwd: string, path: string): string {
  const rel = relative(cwd, path);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) ? rel : path;
}
