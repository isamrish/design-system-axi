// Scores the Gutenberg live-test outputs:
// `pnpm exec tsx eval/experiments/2026-09-17-live-agents/score.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const exported = new Map(
  Object.entries(
    JSON.parse(
      readFileSync(here('gutenberg/published-exports.json'), 'utf8'),
    ) as Record<string, string[]>,
  ).map(([pkg, names]) => [pkg, new Set(names)]),
);

// One entry per task item. Strict: the design system's current component,
// from @wordpress/ui. Valid: any exported component that serves the item.
const items = [
  { strict: ['CollapsibleCard', 'Collapsible'], valid: ['PanelBody', 'Panel'] },
  { strict: ['EmptyState'], valid: ['Placeholder'] },
  { strict: ['InputControl'], valid: ['ValidatedInputControl', 'TextControl'] },
  { strict: ['Badge'], valid: [] },
  { strict: ['ValidityIndicator'], valid: ['ValidatedInputControl'] },
];

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const runs = [
  'a1',
  'a2',
  'a3',
  'b1',
  'b2',
  'b3',
  'c1',
  'c2',
  'c3',
  'd1',
  'd2',
  'd3',
  'e1',
  'e2',
  'e3',
];

// Type-check results recorded against the installed packages (typecheck.txt).
const typeErrors = new Map<string, number>();
for (const [, run = ''] of readFileSync(
  here('gutenberg/typecheck.txt'),
  'utf8',
).matchAll(/^outputs\/(\w+)\.tsx\(\d+,\d+\): error/gm))
  typeErrors.set(run, (typeErrors.get(run) ?? 0) + 1);

for (const run of runs) {
  const source = readFileSync(here(`gutenberg/outputs/${run}.tsx`), 'utf8');
  const imports = new Map<string, string>();
  for (const [, names = '', pkg = ''] of source.matchAll(IMPORT))
    for (const part of names.split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0];
      if (name && exported.has(pkg)) imports.set(name, pkg);
    }
  const exists = (name: string) => {
    const pkg = imports.get(name);
    return pkg !== undefined && exported.get(pkg)?.has(name) === true;
  };
  const strict = items.filter(item =>
    item.strict.some(n => exists(n) && imports.get(n) === '@wordpress/ui'),
  ).length;
  const valid = items.filter(item =>
    [...item.strict, ...item.valid].some(exists),
  ).length;
  const missing = [...imports.keys()]
    .filter(name => !exists(name))
    .map(name => `${name} from ${imports.get(name)}`);
  console.log(
    `${run}: strict ${strict}/5, valid ${valid}/5, type errors ${typeErrors.get(run) ?? 0}, not exported: ${missing.join(', ') || 'none'}`,
  );
}
