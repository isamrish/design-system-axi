// Scores the Primer CLI comparison outputs:
// `pnpm exec tsx eval/experiments/2026-09-17-live-agents/primer-cli-comparison/score.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const deprecated = new Set(
  (
    JSON.parse(readFileSync(here('deprecated.json'), 'utf8')) as {
      deprecated: { name: string; import: string }[];
    }
  ).deprecated.map(entry => `${entry.name} from ${entry.import}`),
);
const passed = new Set(
  [
    ...readFileSync(here('typecheck.txt'), 'utf8').matchAll(
      /^(\w+) tsc=pass$/gm,
    ),
  ].map(match => match[1]),
);

// The current component for each task item, from where the catalog says it lives.
const expected = [
  'Banner from @primer/react',
  'PageHeader from @primer/react',
  'UnderlineNav from @primer/react',
  'Blankslate from @primer/react/experimental',
  'DataTable from @primer/react/experimental',
];

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
for (const run of ['d1', 'd2', 'd3', 'e1', 'e2', 'e3']) {
  const source = readFileSync(here(`outputs/${run}.tsx`), 'utf8');
  const imports = new Set<string>();
  for (const [, names = '', pkg = ''] of source.matchAll(IMPORT))
    for (const part of names.split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0];
      if (name) imports.add(`${name} from ${pkg}`);
    }
  const strict = expected.filter(entry => imports.has(entry)).length;
  const old = [...imports].filter(
    entry => deprecated.has(entry) || entry.endsWith('/deprecated'),
  );
  console.log(
    `${run}: strict ${strict}/5, deprecated used: ${old.join(', ') || 'none'}, tsc ${passed.has(run) ? 'pass' : 'fail'}`,
  );
}
