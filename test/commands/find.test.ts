import { describe, expect, it } from "vitest";
import { findCommand } from "../../src/commands/find.js";
import { runCli } from "../helpers/cli.js";
import {
  makeCatalog,
  makeComponent,
  writeProjectCatalog,
} from "../helpers/catalog.js";
import { tmpDir } from "../helpers/tmp.js";

const now = () => new Date("2026-09-13T12:00:00.000Z");

async function project(
  components = [
    makeComponent({
      id: "confirmationdialog",
      name: "ConfirmationDialog",
      description: "Confirms a destructive action before it happens.",
    }),
    makeComponent({ id: "spinner", name: "Spinner" }),
  ],
) {
  const cwd = tmpDir();
  await writeProjectCatalog(cwd, makeCatalog(components));
  return { cwd, env: {}, now };
}

describe("findCommand", () => {
  it("returns ranked matches with evidence", async () => {
    expect(await findCommand(["confirm", "dialog"], await project())).toEqual({
      intent: "confirm dialog",
      matches: [
        {
          component: "ConfirmationDialog",
          status: "alpha",
          score: 1,
          why: 'name "ConfirmationDialog" matches "dialog"',
        },
      ],
      help: [
        "Run `design-system-axi component ConfirmationDialog` for props, import, and an example",
      ],
    });
  });

  it("points to --id when the top match shares its name", async () => {
    const ctx = await project([
      makeComponent({ id: "dialog", name: "Dialog", status: "deprecated" }),
      makeComponent({ id: "dialog_v2", name: "Dialog" }),
    ]);
    expect((await findCommand(["dialog"], ctx)).help).toEqual([
      "Run `design-system-axi component dialog_v2 --id` for props, import, and an example",
    ]);
  });

  it("reports no matches definitively", async () => {
    expect(await findCommand(["xyzzy"], await project())).toEqual({
      intent: "xyzzy",
      matches: [],
      result: 'no components match "xyzzy"',
      help: [
        "Run `design-system-axi components` to browse all components",
        "Try other words for what the UI does",
      ],
    });
  });

  it("requires an intent and validates --limit", async () => {
    const ctx = await project();
    await expect(findCommand([], ctx)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: 'usage: design-system-axi find "<intent>" [--limit <n>]',
    });
    await expect(findCommand(["x", "--limit", "0"], ctx)).rejects.toMatchObject(
      { code: "VALIDATION_ERROR" },
    );
  });

  it("renders a TOON table through the CLI", async () => {
    const result = await runCli(["find", "spinner"], await project());
    expect(result.out).toContain("matches[1]{component,status,score,why}:");
  });
});
