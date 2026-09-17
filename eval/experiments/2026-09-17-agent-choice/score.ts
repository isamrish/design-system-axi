// Scores picks.json against the registered golden components:
// `pnpm exec tsx eval/experiments/2026-09-17-agent-choice/score.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const picks = JSON.parse(readFileSync(here('picks.json'), 'utf8')) as Record<
  string,
  Record<string, string[]>
>;
const registrations = {
  primer: '../../tasks-3.json',
  gutenberg: '../../tasks-4.json',
} as const;

for (const [designSystem, path] of Object.entries(registrations)) {
  const tasks = (
    JSON.parse(readFileSync(here(path), 'utf8')) as {
      tasks: { id: string; golden: string[] }[];
    }
  ).tasks;
  // A name counts only if the agent's own listing contains it.
  const listed = new Set(
    [
      ...readFileSync(here(`${designSystem}-names.txt`), 'utf8').matchAll(
        /^ {2}([A-Za-z][\w.]*),/gm,
      ),
    ].map(match => match[1]),
  );
  for (const arm of ['names', 'about']) {
    const answers = picks[`${designSystem}-${arm}`] ?? {};
    let top3 = 0;
    let top1 = 0;
    for (const task of tasks) {
      const valid = (answers[task.id] ?? []).filter(name => listed.has(name));
      if (valid.slice(0, 3).some(name => task.golden.includes(name))) top3++;
      if (valid[0] !== undefined && task.golden.includes(valid[0])) top1++;
    }
    console.log(
      `${designSystem} ${arm}: top 3 ${top3}/${tasks.length}, first pick ${top1}/${tasks.length}`,
    );
  }
}
