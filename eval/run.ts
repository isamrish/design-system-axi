import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode } from '@toon-format/toon';
import { componentCommand } from '../src/commands/component.js';
import type { CommandContext } from '../src/commands/context.js';
import { findCommand } from '../src/commands/find.js';
import { syncCommand } from '../src/commands/sync.js';
import { DESIGN_SYSTEMS, syncArgs } from './design-systems.js';

interface Registration {
  registration: number;
  designSystem: string;
  tasks: { id: string; intent: string; golden: string[] }[];
}

/** Only registration 1 gates CI; later registrations are held-out measurements. */
const GATED_REGISTRATION = 1;
const TARGET = 0.85;
const root = fileURLToPath(new URL('..', import.meta.url));
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const registrations = readdirSync(join(root, 'eval'))
  .filter(file => /^tasks(-\d+)?\.json$/.test(file))
  .map(
    file =>
      JSON.parse(
        readFileSync(join(root, 'eval', file), 'utf8'),
      ) as Registration,
  )
  .sort((a, b) => a.registration - b.registration);

const tmp = mkdtempSync(join(tmpdir(), 'design-system-axi-eval-'));
const now = () => new Date();

/** Each design system is synced once into its own directory and scored there. */
const contexts = new Map<string, CommandContext>();
async function contextFor(designSystem: string): Promise<CommandContext> {
  const existing = contexts.get(designSystem);
  if (existing) return existing;
  const cwd = join(tmp, String(contexts.size));
  mkdirSync(cwd);
  const ctx: CommandContext = { cwd, env: {}, now };
  await syncCommand(syncArgs(designSystem), ctx);
  contexts.set(designSystem, ctx);
  return ctx;
}

try {
  let gateMet = true;

  for (const registration of registrations) {
    const ctx = await contextFor(registration.designSystem);
    const storybook = DESIGN_SYSTEMS[registration.designSystem]?.storybook;
    const rawManifest = storybook
      ? readFileSync(join(storybook, 'manifests', 'components.json'), 'utf8')
      : '';
    let hits = 0;
    let tokens = 0;
    const rows: Record<string, unknown>[] = [];
    for (const task of registration.tasks) {
      const found = await findCommand([task.intent, '--limit', '3'], ctx);
      const matches = found.matches as { component: string; match: string }[];
      const top3 = matches.map(match => match.component);
      const hit = task.golden.some(name => top3.includes(name));
      if (hit) hits += 1;
      let taskTokens = estimateTokens(encode(found));
      if (top3[0])
        taskTokens += estimateTokens(
          encode(await componentCommand([top3[0]], ctx)),
        );
      tokens += taskTokens;
      rows.push({
        id: task.id,
        hit: hit ? 'yes' : 'no',
        top3: top3.join(' | '),
        top_match: matches[0]?.match ?? 'none',
        golden: task.golden.join(' | '),
        tokens: taskTokens,
      });
    }

    const count = registration.tasks.length;
    const retrieval = hits / count;
    const gated = registration.registration === GATED_REGISTRATION;
    if (gated && retrieval < TARGET) gateMet = false;
    console.log(
      encode({
        registration: registration.registration,
        design_system: registration.designSystem,
        tasks: rows,
        summary: {
          retrieval_top3: `${hits}/${count} (${Math.round(retrieval * 100)}%)`,
          target: gated ? `${TARGET * 100}% (gates CI)` : 'none (held-out)',
          avg_tokens_per_task: Math.round(tokens / count),
          raw_manifest_tokens: estimateTokens(rawManifest),
        },
      }),
    );
  }
  process.exitCode = gateMet ? 0 : 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
