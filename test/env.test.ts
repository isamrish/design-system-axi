import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatAge } from '../src/env/age.js';
import { readInstalledVersion } from '../src/env/installed.js';
import { tmpDir } from './helpers/tmp.js';

describe('formatAge', () => {
  const now = new Date('2026-09-13T12:00:00.000Z');

  it('formats relative ages', () => {
    expect(formatAge('2026-09-13T11:59:30.000Z', now)).toBe('just now');
    expect(formatAge('2026-09-13T11:15:00.000Z', now)).toBe('45m ago');
    expect(formatAge('2026-09-13T07:00:00.000Z', now)).toBe('5h ago');
    expect(formatAge('2026-09-11T12:00:00.000Z', now)).toBe('2d ago');
  });

  it('treats future timestamps as just now', () => {
    expect(formatAge('2026-09-14T00:00:00.000Z', now)).toBe('just now');
  });
});

describe('readInstalledVersion', () => {
  it('finds the installed package walking up from the working directory', async () => {
    const root = tmpDir();
    const pkgDir = join(root, 'node_modules', '@primer', 'react');
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@primer/react', version: '38.39.0' }),
    );
    const nested = join(root, 'src', 'pages');
    mkdirSync(nested, { recursive: true });
    expect(await readInstalledVersion(nested, '@primer/react')).toBe('38.39.0');
  });

  it('returns undefined when the package is not installed or unknown', async () => {
    expect(
      await readInstalledVersion(tmpDir(), '@primer/react'),
    ).toBeUndefined();
    expect(await readInstalledVersion(tmpDir(), 'unknown')).toBeUndefined();
  });
});
