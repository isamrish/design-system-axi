import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DESIGN_SYSTEMS,
  loadCatalogComponents,
} from '../eval/design-systems.js';

interface Registration {
  registration: number;
  designSystem: string;
  tasks: { id: string; intent: string; golden: string[] }[];
}

const evalDir = fileURLToPath(new URL('../eval/', import.meta.url));
const registrations = readdirSync(evalDir)
  .filter(file => /^tasks(-\d+)?\.json$/.test(file))
  .map(
    file =>
      JSON.parse(readFileSync(`${evalDir}${file}`, 'utf8')) as Registration,
  )
  .sort((a, b) => a.registration - b.registration);

describe('eval registrations', () => {
  it('are numbered in order', () => {
    expect(registrations.map(r => r.registration)).toEqual(
      registrations.map((_, index) => index + 1),
    );
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

  it('each name a design system the runner knows how to sync', () => {
    for (const registration of registrations)
      expect(Object.keys(DESIGN_SYSTEMS)).toContain(registration.designSystem);
  });

  it('only name components that exist in their own design system', async () => {
    const missing: string[] = [];
    for (const designSystem of new Set(
      registrations.map(r => r.designSystem),
    )) {
      const names = new Set(
        (await loadCatalogComponents(designSystem)).map(c => c.name),
      );
      for (const registration of registrations)
        if (registration.designSystem === designSystem)
          for (const task of registration.tasks)
            for (const name of task.golden)
              if (!names.has(name))
                missing.push(`${task.id} ${designSystem}: ${name}`);
    }
    expect(missing).toEqual([]);
  });
});
