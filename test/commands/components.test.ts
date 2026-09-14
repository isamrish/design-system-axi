import { describe, expect, it } from 'vitest';
import { componentsCommand } from '../../src/commands/components.js';
import { runCli } from '../helpers/cli.js';
import {
  makeCatalog,
  makeComponent,
  writeProjectCatalog,
} from '../helpers/catalog.js';
import { tmpDir } from '../helpers/tmp.js';

const now = () => new Date('2026-09-13T12:00:00.000Z');
const HELP = [
  'Run `design-system-axi component <Name>` for props, import, and an example',
  'Run `design-system-axi find "<what you are building>"` to rank components by purpose',
];

async function project() {
  const cwd = tmpDir();
  await writeProjectCatalog(
    cwd,
    makeCatalog([
      makeComponent({ id: 'button', name: 'Button' }),
      makeComponent({
        id: 'dialog',
        name: 'Dialog',
        status: 'deprecated',
        import: 'import { Dialog } from "@acme/ui/deprecated";',
      }),
      makeComponent({ id: 'dialog_v2', name: 'Dialog' }),
      makeComponent({
        id: 'tabs',
        name: 'Tabs',
        status: 'draft',
        import: 'import { Tabs } from "@acme/ui/experimental";',
      }),
    ]),
  );
  return { cwd, env: {}, now };
}

describe('componentsCommand', () => {
  it('lists non-deprecated components by default', async () => {
    expect(await componentsCommand([], await project())).toEqual({
      total: 3,
      components: [
        { name: 'Button', status: 'alpha', from: '@acme/ui' },
        { name: 'Dialog', status: 'alpha', from: '@acme/ui' },
        { name: 'Tabs', status: 'draft', from: '@acme/ui/experimental' },
      ],
      excluded: '1 deprecated (use --status deprecated)',
      help: HELP,
    });
  });

  it('filters by status', async () => {
    expect(
      await componentsCommand(['--status', 'deprecated'], await project()),
    ).toEqual({
      total: 1,
      components: [
        { name: 'Dialog', status: 'deprecated', from: '@acme/ui/deprecated' },
      ],
      help: HELP,
    });
  });

  it('reports an empty status definitively', async () => {
    expect(
      await componentsCommand(['--status', 'beta'], await project()),
    ).toEqual({
      total: 0,
      components: [],
      result: 'no components with status "beta"',
      help: HELP,
    });
  });

  it('reports truncation', async () => {
    const output = await componentsCommand(['--limit', '2'], await project());
    expect(output.components).toHaveLength(2);
    expect(output.truncated).toBe('showing 2 of 3 (use --limit)');
  });

  it('validates flags and arguments', async () => {
    const ctx = await project();
    await expect(
      componentsCommand(['--status', 'bogus'], ctx),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message:
        '--status must be one of stable, beta, alpha, draft, deprecated, unknown',
    });
    await expect(componentsCommand(['Button'], ctx)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('requires a catalog', async () => {
    await expect(
      componentsCommand([], { cwd: tmpDir(), env: {}, now }),
    ).rejects.toMatchObject({ code: 'NO_CATALOG' });
  });

  it('renders a TOON table through the CLI', async () => {
    const ctx = await project();
    const result = await runCli(['components'], ctx);
    expect(result.out).toContain('components[3]{name,status,from}:');
    expect(result.out).toContain('Tabs,draft,@acme/ui/experimental');
  });
});
