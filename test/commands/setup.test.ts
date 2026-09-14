import type { SessionStartHookStatus } from 'axi-sdk-js';
import { describe, expect, it } from 'vitest';
import { type SetupDeps, setupCommand } from '../../src/commands/setup.js';

const ctx = {
  cwd: '/work/app',
  env: {},
  now: () => new Date('2026-09-13T12:00:00.000Z'),
};

function fakeDeps(
  installed: { claude: boolean; codex: boolean; opencode: boolean },
  errors: string[] = [],
) {
  const calls: unknown[] = [];
  const deps: SetupDeps = {
    install: options => {
      calls.push(options);
      for (const message of errors) options.onError?.(message);
    },
    status: (options): SessionStartHookStatus => ({
      marker: 'design-system-axi',
      scope: options.scope ?? 'user',
      claude: { installed: installed.claude, path: 'claude' },
      codex: {
        installed: installed.codex,
        path: 'codex',
        userFeatureEnabled: false,
        userFeaturePath: 'config',
      },
      opencode: { installed: installed.opencode, path: 'opencode' },
    }),
  };
  return { deps, calls };
}

describe('setupCommand', () => {
  it('installs project hooks and reports status per agent', async () => {
    const { deps, calls } = fakeDeps({
      claude: true,
      codex: true,
      opencode: false,
    });
    expect(await setupCommand(['hooks'], ctx, deps)).toEqual({
      scope: 'project',
      hooks: {
        claude: 'installed',
        codex: 'installed',
        opencode: 'not installed',
      },
      help: [
        'New agent sessions in this project start with `design-system-axi` output',
        'Run `design-system-axi sync` so that output includes the catalog',
      ],
    });
    expect(calls).toEqual([
      expect.objectContaining({
        marker: 'design-system-axi',
        scope: 'project',
        projectDir: '/work/app',
      }),
    ]);
  });

  it('installs user hooks with --user', async () => {
    const { deps, calls } = fakeDeps({
      claude: true,
      codex: false,
      opencode: false,
    });
    const output = await setupCommand(['hooks', '--user'], ctx, deps);
    expect(output.scope).toBe('user');
    expect(output.help).toContain(
      'New agent sessions start with `design-system-axi` output',
    );
    expect(calls).toEqual([expect.objectContaining({ scope: 'user' })]);
  });

  it('explains when nothing was installed and surfaces errors', async () => {
    const { deps } = fakeDeps(
      { claude: false, codex: false, opencode: false },
      ['cannot write settings.json'],
    );
    const output = await setupCommand(['hooks'], ctx, deps);
    expect(output.note).toBe(
      'hooks install only from the installed binary; run `npm install -g design-system-axi`, then `design-system-axi setup hooks`',
    );
    expect(output.errors).toEqual(['cannot write settings.json']);
  });

  it('validates usage', async () => {
    const { deps } = fakeDeps({ claude: false, codex: false, opencode: false });
    await expect(setupCommand([], ctx, deps)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'usage: design-system-axi setup hooks [--user]',
    });
  });
});
