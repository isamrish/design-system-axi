// Generates skills/design-system-axi/SKILL.md from src/skill.ts as a minimal stub that
// defers to the live CLI.
//
//   pnpm run build:skill            # write the file
//   pnpm run build:skill -- --check # fail (exit 1) if the committed file is stale
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import { createSkillMarkdown } from '../src/skill.js';

const target = new URL('../skills/design-system-axi/SKILL.md', import.meta.url);
const targetPath = fileURLToPath(target);
const expected = await format(createSkillMarkdown(), { filepath: targetPath });

if (process.argv.includes('--check')) {
  let actual: string | null = null;
  try {
    actual = await readFile(target, 'utf8');
  } catch {
    // a missing file falls through to the mismatch branch
  }
  if (actual !== expected) {
    console.error(
      'skills/design-system-axi/SKILL.md is out of date. Run `pnpm run build:skill` and commit the result.',
    );
    process.exit(1);
  }
  console.log('skills/design-system-axi/SKILL.md is up to date.');
} else {
  await mkdir(new URL('../skills/design-system-axi/', import.meta.url), {
    recursive: true,
  });
  await writeFile(target, expected);
  console.log(`Wrote ${targetPath}`);
}
