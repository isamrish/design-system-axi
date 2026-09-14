import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPrimer } from "../src/adapters/primer/load.js";
import { loadStorybook } from "../src/adapters/storybook/load.js";
import { mergeFragments } from "../src/catalog/merge.js";

interface Registration {
  registration: number;
  tasks: { id: string; intent: string; golden: string[] }[];
}

const registration = JSON.parse(
  readFileSync(new URL("../eval/tasks.json", import.meta.url), "utf8"),
) as Registration;

describe("eval registration", () => {
  it("has 20 uniquely identified tasks with golden components", () => {
    expect(registration.tasks).toHaveLength(20);
    expect(new Set(registration.tasks.map((task) => task.id)).size).toBe(20);
    for (const task of registration.tasks) {
      expect(task.intent.length).toBeGreaterThan(0);
      expect(task.golden.length).toBeGreaterThan(0);
    }
  });

  it("only names components that exist in the Primer catalog", async () => {
    const [sb, pr] = await Promise.all([
      loadStorybook(
        fileURLToPath(new URL("./fixtures/primer/storybook", import.meta.url)),
      ),
      loadPrimer(
        fileURLToPath(new URL("./fixtures/primer/package", import.meta.url)),
      ),
    ]);
    const names = new Set(
      mergeFragments([sb, pr]).components.map((component) => component.name),
    );
    const missing = registration.tasks
      .flatMap((task) => task.golden)
      .filter((name) => !names.has(name));
    expect(missing).toEqual([]);
  });
});
