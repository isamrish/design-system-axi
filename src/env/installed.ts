import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/** The version of `packageName` installed in the nearest node_modules above `cwd`. */
export async function readInstalledVersion(
  cwd: string,
  packageName: string,
): Promise<string | undefined> {
  if (!packageName || packageName === 'unknown') return undefined;
  let dir = resolve(cwd);
  for (;;) {
    try {
      const pkg = JSON.parse(
        await readFile(
          join(dir, 'node_modules', packageName, 'package.json'),
          'utf8',
        ),
      ) as { version?: unknown };
      if (typeof pkg.version === 'string') return pkg.version;
    } catch {
      // not installed at this level; keep walking up
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
