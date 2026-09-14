import { join } from 'node:path';
import { parseOrThrow } from '../parse.js';
import { readJson } from '../read-json.js';
import type { SourceFragment } from '../types.js';
import { PackageJsonSchema, translatePrimer } from './translate.js';

export const PRIMER_SOURCE_HINT =
  'Install @primer/react, or point --primer at a directory containing package.json and generated/components.json';

export async function loadPrimer(dir: string): Promise<SourceFragment> {
  const data = await readJson(
    join(dir, 'generated', 'components.json'),
    PRIMER_SOURCE_HINT,
  );
  const pkg = parseOrThrow(
    PackageJsonSchema,
    await readJson(join(dir, 'package.json'), PRIMER_SOURCE_HINT),
    'primer-components-json',
  );
  return translatePrimer(data, dir, { name: pkg.name, version: pkg.version });
}
