import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPrimer } from '../src/adapters/primer/load.js';
import { loadStorybook } from '../src/adapters/storybook/load.js';
import type { SourceFragment } from '../src/adapters/types.js';
import { mergeFragments } from '../src/catalog/merge.js';
import type { Component } from '../src/catalog/schema.js';

const fixtures = fileURLToPath(new URL('../test/fixtures/', import.meta.url));

interface Sources {
  storybook?: string;
  primer?: string;
}

/**
 * The committed fixture each registration's `designSystem` is scored against.
 * A registration naming anything else fails instead of being scored against
 * the wrong catalog. Gutenberg's Storybook has no version, so its key names the
 * date the committed snapshot was fetched.
 */
export const DESIGN_SYSTEMS: Record<string, Sources> = {
  '@primer/react@38.39.0': {
    storybook: join(fixtures, 'primer', 'storybook'),
    primer: join(fixtures, 'primer', 'package'),
  },
  'wordpress-gutenberg-storybook@2026-09-16': {
    storybook: join(fixtures, 'wordpress', 'storybook'),
  },
};

function sourcesFor(designSystem: string): Sources {
  const sources = DESIGN_SYSTEMS[designSystem];
  if (!sources)
    throw new Error(
      `unknown designSystem "${designSystem}"; add its fixture to eval/design-systems.ts`,
    );
  return sources;
}

/** `sync` flags that build the catalog for a registration's design system. */
export function syncArgs(designSystem: string): string[] {
  const { storybook, primer } = sourcesFor(designSystem);
  return [
    ...(storybook ? ['--storybook', storybook] : []),
    ...(primer ? ['--primer', primer] : []),
  ];
}

/** The merged components for a design system, as `sync` would catalogue them. */
export async function loadCatalogComponents(
  designSystem: string,
): Promise<Component[]> {
  const { storybook, primer } = sourcesFor(designSystem);
  const fragments: SourceFragment[] = [];
  if (storybook) fragments.push(await loadStorybook(storybook));
  if (primer) fragments.push(await loadPrimer(primer));
  return mergeFragments(fragments).components;
}
