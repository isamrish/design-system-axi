import { describe, expect, it } from "vitest";
import { buildIndex, search } from "../../src/search/rank.js";
import { makeComponent, makeProp } from "../helpers/catalog.js";

const components = [
  makeComponent({
    id: "button",
    name: "Button",
    props: [
      makeProp({ name: "variant", type: "'default' | 'primary' | 'danger'" }),
    ],
    examples: [
      { id: "components-button--default", name: "Default", snippet: "" },
      { id: "components-button--danger", name: "Danger", snippet: "" },
    ],
  }),
  makeComponent({
    id: "confirmationdialog",
    name: "ConfirmationDialog",
    description: "Confirms a destructive action before it happens.",
  }),
  makeComponent({ id: "dialog", name: "Dialog", status: "deprecated" }),
  makeComponent({ id: "dialog_v2", name: "Dialog" }),
  makeComponent({ id: "spinner", name: "Spinner" }),
];
const index = buildIndex(components);
const rows = (query: string, limit = 5) =>
  search(index, query, limit).map((match) => [
    match.component.id,
    match.score,
    match.why,
  ]);

describe("search", () => {
  it("ranks name matches, breaks ties by name, and down-weights deprecated components", () => {
    expect(rows("dialogs")).toEqual([
      ["confirmationdialog", 1, 'name "ConfirmationDialog" matches "dialog"'],
      ["dialog_v2", 1, 'name "Dialog" matches "dialog"'],
      ["dialog", 0.3, 'name "Dialog" matches "dialog"'],
    ]);
  });

  it("uses synonyms at reduced weight and explains them", () => {
    expect(rows("delete")).toEqual([
      [
        "confirmationdialog",
        1,
        'description "Confirms a destructive action before it…" matches "delete" (synonym "destructive")',
      ],
      ["button", 0.75, 'prop "danger" matches "delete" (synonym "danger")'],
    ]);
  });

  it("respects the limit", () => {
    expect(rows("dialog", 1)).toHaveLength(1);
  });

  it("returns no matches for unknown words", () => {
    expect(rows("xyzzy")).toEqual([]);
  });
});
