import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@toon-format/toon";
import { componentCommand } from "../src/commands/component.js";
import { findCommand } from "../src/commands/find.js";
import { syncCommand } from "../src/commands/sync.js";

interface Registration {
  registration: number;
  tasks: { id: string; intent: string; golden: string[] }[];
}

const TARGET = 0.85;
const root = fileURLToPath(new URL("..", import.meta.url));
const fixtures = join(root, "test", "fixtures", "primer");
const registration = JSON.parse(
  readFileSync(join(root, "eval", "tasks.json"), "utf8"),
) as Registration;
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const cwd = mkdtempSync(join(tmpdir(), "design-system-axi-eval-"));
const ctx = { cwd, env: {}, now: () => new Date() };

try {
  await syncCommand(
    [
      "--storybook",
      join(fixtures, "storybook"),
      "--primer",
      join(fixtures, "package"),
    ],
    ctx,
  );

  let hits = 0;
  let tokens = 0;
  const rows: Record<string, unknown>[] = [];
  for (const task of registration.tasks) {
    const found = await findCommand([task.intent, "--limit", "3"], ctx);
    const top3 = (found.matches as { component: string }[]).map(
      (match) => match.component,
    );
    const hit = task.golden.some((name) => top3.includes(name));
    if (hit) hits += 1;
    let taskTokens = estimateTokens(encode(found));
    if (top3[0])
      taskTokens += estimateTokens(
        encode(await componentCommand([top3[0]], ctx)),
      );
    tokens += taskTokens;
    rows.push({
      id: task.id,
      hit: hit ? "yes" : "no",
      top3: top3.join(" | "),
      golden: task.golden.join(" | "),
      tokens: taskTokens,
    });
  }

  const count = registration.tasks.length;
  const retrieval = hits / count;
  const rawManifest = readFileSync(
    join(fixtures, "storybook", "manifests", "components.json"),
    "utf8",
  );
  console.log(
    encode({
      registration: registration.registration,
      tasks: rows,
      summary: {
        retrieval_top3: `${hits}/${count} (${Math.round(retrieval * 100)}%)`,
        target: `${TARGET * 100}%`,
        avg_tokens_per_task: Math.round(tokens / count),
        raw_manifest_tokens: estimateTokens(rawManifest),
      },
    }),
  );
  process.exitCode = retrieval >= TARGET ? 0 : 1;
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
