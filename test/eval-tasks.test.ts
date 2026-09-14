import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadPrimer } from '../src/adapters/primer/load.js';
import { loadStorybook } from '../src/adapters/storybook/load.js';
import { mergeFragments } from '../src/catalog/merge.js';

interface Registration {
  registration: number;
  tasks: { id: string; intent: string; golden: string[] }[];
}

const registrations = ['tasks.json', 'tasks-2.json', 'tasks-3.json'].map(
  file =>
    JSON.parse(
      readFileSync(new URL(`../eval/${file}`, import.meta.url), 'utf8'),
    ) as Registration,
);

describe('eval registrations', () => {
  it('are numbered in order', () => {
    expect(registrations.map(r => r.registration)).toEqual([1, 2, 3]);
  });

  it('each have 20 tasks with golden components and ids unique across registrations', () => {
    const ids = registrations.flatMap(r => r.tasks.map(task => task.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const registration of registrations) {
      expect(registration.tasks).toHaveLength(20);
      for (const task of registration.tasks) {
        expect(task.intent.length).toBeGreaterThan(0);
        expect(task.golden.length).toBeGreaterThan(0);
      }
    }
  });

  it('only name components that exist in the Primer catalog', async () => {
    const [sb, pr] = await Promise.all([
      loadStorybook(
        fileURLToPath(new URL('./fixtures/primer/storybook', import.meta.url)),
      ),
      loadPrimer(
        fileURLToPath(new URL('./fixtures/primer/package', import.meta.url)),
      ),
    ]);
    const names = new Set(
      mergeFragments([sb, pr]).components.map(component => component.name),
    );
    const missing = registrations
      .flatMap(r => r.tasks.flatMap(task => task.golden))
      .filter(name => !names.has(name));
    expect(missing).toEqual([]);
  });
});
