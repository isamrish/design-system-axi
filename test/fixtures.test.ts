import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${path}`, import.meta.url), 'utf8'),
  );

describe('primer fixtures', () => {
  it('contains the Storybook components manifest', () => {
    const manifest = read('primer/storybook/manifests/components.json');
    expect(typeof manifest.v).toBe('number');
    expect(Object.keys(manifest.components)).toHaveLength(210);
  });

  it('contains the Primer package metadata', () => {
    expect(read('primer/package/package.json')).toMatchObject({
      name: '@primer/react',
      version: '38.39.0',
    });
    expect(
      Object.keys(read('primer/package/generated/components.json').components),
    ).toHaveLength(80);
  });
});

describe('wordpress fixtures', () => {
  it('contains the full Gutenberg Storybook manifest', () => {
    const manifest = read('wordpress/storybook/manifests/components.json');
    expect(typeof manifest.v).toBe('number');
    expect(Object.keys(manifest.components)).toHaveLength(75);
    expect(Object.keys(manifest.components)).toEqual(
      expect.arrayContaining([
        'design-system-components-tabs',
        'components-togglecontrol',
      ]),
    );
  });
});
