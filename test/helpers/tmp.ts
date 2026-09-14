import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

/** A fresh, real-path temp directory removed after the current test. */
export function tmpDir(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'design-system-axi-')));
  created.push(dir);
  return dir;
}
