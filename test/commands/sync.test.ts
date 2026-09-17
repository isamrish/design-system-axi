import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SourceFragment } from '../../src/adapters/types.js';
import { readCatalog } from '../../src/catalog/store.js';
import {
  type Loaders,
  resolveIdentity,
  syncCommand,
} from '../../src/commands/sync.js';
import { runCli } from '../helpers/cli.js';
import { tmpDir } from '../helpers/tmp.js';

const now = () => new Date('2026-09-13T12:00:00.000Z');

const primerFragment: SourceFragment = {
  adapter: 'primer-components-json',
  location: '/pkg',
  priority: 2,
  distinctEntries: true,
  designSystem: {
    name: 'Primer React',
    package: '@primer/react',
    version: '38.39.0',
  },
  components: [
    {
      key: 'button',
      name: 'Button',
      isComponent: true,
      storyIds: [],
      import: 'import { Button } from "@primer/react";',
      status: 'alpha',
    },
  ],
};
const loaders: Loaders = {
  storybook: async () => ({
    adapter: 'storybook',
    location: 'https://sb.example',
    priority: 1,
    distinctEntries: false,
    components: [],
  }),
  'primer-components-json': async () => primerFragment,
};

describe('syncCommand', () => {
  it('writes the catalog and reports the result', async () => {
    const cwd = tmpDir();
    const output = await syncCommand(
      ['--primer', '/pkg'],
      { cwd, env: {}, now },
      loaders,
    );
    expect(output).toEqual({
      synced: join('.design-system-axi', 'catalog.json'),
      design_system: 'Primer React @primer/react 38.39.0',
      sources: [
        { adapter: 'primer-components-json', location: '/pkg', entries: 1 },
      ],
      components: 1,
      skipped_entries: 0,
      changes: 'initial sync',
      help: [
        'Run `design-system-axi` for an overview',
        'Run `design-system-axi find "<what you are building>"` to pick components',
      ],
    });
    const catalog = await readCatalog(
      join(cwd, '.design-system-axi', 'catalog.json'),
    );
    expect(catalog).toMatchObject({
      syncedAt: '2026-09-13T12:00:00.000Z',
      generatedBy: { tool: 'design-system-axi' },
    });
    expect(
      (await syncCommand(['--primer', '/pkg'], { cwd, env: {}, now }, loaders))
        .changes,
    ).toBe('none');
  });

  it('names the entries it skipped, capped with a size hint', async () => {
    const skippable = (key: string) => ({
      key,
      name: key,
      isComponent: false,
      storyIds: [`${key}--default`],
    });
    const many = {
      ...loaders,
      storybook: async () => ({
        adapter: 'storybook' as const,
        location: 'https://sb.example',
        priority: 1,
        distinctEntries: false,
        components: [
          'hooks-a',
          'hooks-b',
          'hooks-c',
          'hooks-d',
          'hooks-e',
          'hooks-f',
        ].map(skippable),
      }),
    };
    const output = await syncCommand(
      ['--storybook', 'https://sb.example'],
      { cwd: tmpDir(), env: {}, now },
      many,
    );
    expect(output).toMatchObject({
      skipped_entries: 6,
      skipped: ['hooks-a', 'hooks-b', 'hooks-c', 'hooks-d', 'hooks-e'],
      skipped_shown: '5 of 6 (use --full)',
    });
  });

  it('lists every skipped entry with --full', async () => {
    const output = await syncCommand(
      ['--primer', '/pkg', '--full'],
      { cwd: tmpDir(), env: {}, now },
      loaders,
    );
    expect(output.skipped_entries).toBe(0);
    expect(output).not.toHaveProperty('skipped');
    expect(output).not.toHaveProperty('skipped_shown');
  });

  it('replaces an unreadable catalog', async () => {
    const cwd = tmpDir();
    const catalogDir = join(cwd, '.design-system-axi');
    await mkdir(catalogDir, { recursive: true });
    const catalogPath = join(catalogDir, 'catalog.json');
    await writeFile(catalogPath, '{not json');
    const output = await syncCommand(
      ['--primer', '/pkg'],
      { cwd, env: {}, now },
      loaders,
    );
    expect(output.changes).toBe('replaced unreadable catalog');
    const catalog = await readCatalog(catalogPath);
    expect(catalog).toBeDefined();
  });

  it('requires at least one source', async () => {
    await expect(
      syncCommand([], { cwd: tmpDir(), env: {}, now }, loaders),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects positional arguments', async () => {
    await expect(
      syncCommand(['oops'], { cwd: tmpDir(), env: {}, now }, loaders),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'unexpected argument "oops"',
    });
  });
});

describe('resolveIdentity', () => {
  it('prefers configuration, then the highest-priority fragment, then unknown', () => {
    expect(resolveIdentity({ name: 'Acme' }, [primerFragment])).toEqual({
      name: 'Acme',
      package: '@primer/react',
      version: '38.39.0',
    });
    expect(resolveIdentity({}, [])).toEqual({
      name: 'unknown',
      package: 'unknown',
      version: 'unknown',
    });
  });
});

describe('sync through the CLI', () => {
  it('builds the verified Primer catalog from real fixtures', async () => {
    const cwd = tmpDir();
    const storybook = fileURLToPath(
      new URL('../fixtures/primer/storybook', import.meta.url),
    );
    const primer = fileURLToPath(
      new URL('../fixtures/primer/package', import.meta.url),
    );
    const result = await runCli(
      ['sync', '--storybook', storybook, '--primer', primer],
      { cwd, env: {}, now },
    );
    expect(result.code).toBe(0);
    expect(result.out).toContain(
      'design_system: Primer React @primer/react 38.39.0',
    );
    expect(result.out).toContain('components: 86');
    expect(result.out).toContain('skipped_entries: 8');
    expect(result.out).toContain('changes: initial sync');
    const catalog = await readCatalog(
      join(cwd, '.design-system-axi', 'catalog.json'),
    );
    expect(catalog?.aggregates.byStatus).toEqual({
      stable: 0,
      beta: 6,
      alpha: 56,
      draft: 7,
      deprecated: 12,
      unknown: 5,
    });
  });

  it('reports unreachable sources', async () => {
    const result = await runCli(
      ['sync', '--primer', join(tmpDir(), 'missing')],
      { cwd: tmpDir(), env: {}, now },
    );
    expect(result.code).toBe(1);
    expect(result.out).toContain('code: SOURCE_UNREACHABLE');
  });
});
