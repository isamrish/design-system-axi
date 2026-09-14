import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSyncConfig } from '../../src/config/load.js';
import { tmpDir } from '../helpers/tmp.js';

function project(config: unknown) {
  const root = tmpDir();
  writeFileSync(join(root, 'design-system.axi.json'), JSON.stringify(config));
  const nested = join(root, 'apps', 'web');
  mkdirSync(nested, { recursive: true });
  return { root, nested };
}

describe('resolveSyncConfig', () => {
  it('returns no sources without flags, env, or config', async () => {
    const cwd = tmpDir();
    expect(await resolveSyncConfig({ cwd, env: {} }, {})).toEqual({
      sources: [],
      designSystem: {},
      catalogPath: join(cwd, '.design-system-axi', 'catalog.json'),
    });
  });

  it('reads the config file and resolves file locations against it', async () => {
    const { root, nested } = project({
      designSystem: { name: 'Primer React' },
      sources: [
        {
          adapter: 'storybook',
          location: 'https://primer.style/react/storybook',
        },
        {
          adapter: 'primer-components-json',
          location: 'node_modules/@primer/react',
        },
      ],
    });
    expect(await resolveSyncConfig({ cwd: nested, env: {} }, {})).toEqual({
      sources: [
        {
          adapter: 'storybook',
          location: 'https://primer.style/react/storybook',
        },
        {
          adapter: 'primer-components-json',
          location: join(root, 'node_modules', '@primer', 'react'),
        },
      ],
      designSystem: { name: 'Primer React' },
      catalogPath: join(root, '.design-system-axi', 'catalog.json'),
    });
  });

  it('lets env replace a config source, and flags replace env', async () => {
    const { nested } = project({
      sources: [{ adapter: 'storybook', location: 'https://old.example' }],
    });
    const env = {
      DESIGN_SYSTEM_AXI_STORYBOOK: 'https://env.example',
      DESIGN_SYSTEM_AXI_PRIMER: 'pkg',
    };
    expect((await resolveSyncConfig({ cwd: nested, env }, {})).sources).toEqual(
      [
        { adapter: 'storybook', location: 'https://env.example' },
        { adapter: 'primer-components-json', location: join(nested, 'pkg') },
      ],
    );
    expect(
      (await resolveSyncConfig({ cwd: nested, env }, { storybook: './static' }))
        .sources[0],
    ).toEqual({
      adapter: 'storybook',
      location: join(nested, 'static'),
    });
  });

  it('rejects an invalid config file with VALIDATION_ERROR', async () => {
    const { nested } = project({
      sources: [{ adapter: 'figma', location: 'x' }],
    });
    await expect(
      resolveSyncConfig({ cwd: nested, env: {} }, {}),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: expect.stringContaining('invalid design-system.axi.json'),
    });
  });
});
