import { describe, expect, it } from "vitest";
import { componentCommand, orderProps } from "../../src/commands/component.js";
import { runCli } from "../helpers/cli.js";
import {
  makeCatalog,
  makeComponent,
  makeProp,
  writeProjectCatalog,
} from "../helpers/catalog.js";
import { tmpDir } from "../helpers/tmp.js";

const now = () => new Date("2026-09-13T12:00:00.000Z");

const button = makeComponent({
  id: "button",
  name: "Button",
  description: "Triggers an action.\n  Use for primary actions.",
  props: [
    makeProp({
      name: "variant",
      type: "'default' | 'primary' | 'danger'",
      default: "'default'",
    }),
    makeProp({
      name: "size",
      type: "'small' | 'medium' | 'large'",
      default: "'medium'",
    }),
    makeProp({ name: "alignContent", type: "'start' | 'center'" }),
    makeProp({ name: "children", type: "ReactNode", required: true }),
    makeProp({ name: "block", type: "boolean" }),
    makeProp({ name: "disabled", type: "boolean" }),
    makeProp({ name: "inactive", type: "boolean" }),
    makeProp({ name: "loading", type: "boolean" }),
    makeProp({ name: "onClick", type: "() => void" }),
    makeProp({ name: "sx", type: "SxProp", deprecated: true }),
  ],
  examples: [
    {
      id: "components-button--default",
      name: "Default",
      snippet: "<Button>Go</Button>",
    },
    {
      id: "components-button-features--danger",
      name: "Danger",
      snippet: '<Button variant="danger">Delete</Button>',
    },
  ],
  subcomponents: [
    {
      name: "Button.Counter",
      props: [makeProp({ name: "count", type: "number", required: true })],
    },
  ],
  related: ["IconButton"],
});
const legacyDialog = makeComponent({
  id: "dialog",
  name: "Dialog",
  status: "deprecated",
  deprecation: "Use Dialog from @acme/ui.",
  import: 'import { Dialog } from "@acme/ui/deprecated";',
});
const dialog = makeComponent({ id: "dialog_v2", name: "Dialog" });

async function project() {
  const cwd = tmpDir();
  await writeProjectCatalog(cwd, makeCatalog([button, legacyDialog, dialog]));
  return { cwd, env: {}, now };
}

describe("componentCommand", () => {
  it("shows a compact view by default", async () => {
    expect(await componentCommand(["button"], await project())).toEqual({
      name: "Button",
      status: "alpha",
      import: 'import { Button } from "@acme/ui";',
      description: "Triggers an action. Use for primary actions.",
      props: [
        { name: "children", type: "ReactNode", default: "" },
        { name: "alignContent", type: "'start' | 'center'", default: "" },
        {
          name: "size",
          type: "'small' | 'medium' | 'large'",
          default: "'medium'",
        },
        {
          name: "variant",
          type: "'default' | 'primary' | 'danger'",
          default: "'default'",
        },
        { name: "block", type: "boolean", default: "" },
        { name: "disabled", type: "boolean", default: "" },
        { name: "inactive", type: "boolean", default: "" },
        { name: "loading", type: "boolean", default: "" },
      ],
      props_shown: "8 of 9",
      example: "<Button>Go</Button>",
      examples_total: 2,
      subcomponents: ["Button.Counter"],
      related: ["IconButton"],
      help: [
        "Run `design-system-axi component Button --full` for all 10 props and 2 examples",
        "Run `design-system-axi component Button.Counter` for subcomponent props",
      ],
    });
  });

  it("shows every prop and example with --full", async () => {
    const output = await componentCommand(
      ["Button", "--full"],
      await project(),
    );
    expect(output.props).toHaveLength(10);
    expect(output.props).toContainEqual({
      name: "sx",
      type: "SxProp",
      required: false,
      default: "",
      deprecated: true,
      description: "",
    });
    expect(output.examples).toEqual([
      { name: "Default", snippet: "<Button>Go</Button>" },
      { name: "Danger", snippet: '<Button variant="danger">Delete</Button>' },
    ]);
    expect(output).not.toHaveProperty("props_shown");
    expect(output).not.toHaveProperty("example");
  });

  it("prefers the current component among duplicates and lists the others", async () => {
    const output = await componentCommand(["dialog"], await project());
    expect(output).toMatchObject({
      name: "Dialog",
      status: "alpha",
      other_matches: [
        { id: "dialog", status: "deprecated", from: "@acme/ui/deprecated" },
      ],
    });
    expect(output.help).toContain(
      "Run `design-system-axi component <id> --id` for another match",
    );
  });

  it("looks up by id with --id", async () => {
    const output = await componentCommand(["dialog", "--id"], await project());
    expect(output).toMatchObject({
      name: "Dialog",
      status: "deprecated",
      deprecated: "Use Dialog from @acme/ui.",
    });
    expect(output.help).toEqual([
      "Run `design-system-axi component dialog --id --full` for all 0 props and 0 examples",
      'Run `design-system-axi find "<what you are building>"` for a current alternative',
    ]);
  });

  it("resolves dotted subcomponents", async () => {
    expect(await componentCommand(["button.counter"], await project())).toEqual(
      {
        name: "Button.Counter",
        parent: "Button",
        status: "alpha",
        import: 'import { Button } from "@acme/ui";',
        props: [{ name: "count", type: "number", default: "" }],
        help: [
          "Run `design-system-axi component Button` for the parent component",
        ],
      },
    );
  });

  it("suggests close names when not found", async () => {
    await expect(
      componentCommand(["Buton"], await project()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: 'no component "Buton"',
      suggestions: ["did you mean: Button"],
    });
  });

  it("requires exactly one name", async () => {
    await expect(componentCommand([], await project())).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "usage: design-system-axi component <Name> [--id] [--full]",
    });
  });

  it("returns exit code 1 with NOT_FOUND through the CLI", async () => {
    const result = await runCli(["component", "Buton"], await project());
    expect(result.code).toBe(1);
    expect(result.out).toContain("code: NOT_FOUND");
  });
});

describe("orderProps", () => {
  it("orders required, then literal-typed, then alphabetical", () => {
    const ordered = orderProps([
      makeProp({ name: "b" }),
      makeProp({ name: "a", type: "'x' | 'y'" }),
      makeProp({ name: "z", required: true }),
    ]);
    expect(ordered.map((prop) => prop.name)).toEqual(["z", "a", "b"]);
  });
});
