import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { levenshtein, suggestNames } from "../src/format/suggest.js";
import {
  displayPath,
  importSource,
  oneLine,
  truncate,
} from "../src/format/text.js";

describe("text helpers", () => {
  it("collapses whitespace", () => {
    expect(oneLine("  A\n  ConfirmationDialog\tis  ")).toBe(
      "A ConfirmationDialog is",
    );
  });

  it("truncates with an ellipsis within the limit", () => {
    expect(truncate("abcdef", 6)).toBe("abcdef");
    expect(truncate("abcdefg", 6)).toBe("abcde…");
  });

  it("extracts the import source", () => {
    expect(
      importSource('import { Dialog } from "@primer/react/deprecated";'),
    ).toBe("@primer/react/deprecated");
    expect(importSource("")).toBe("");
  });

  it("shows paths relative to the working directory when inside it", () => {
    expect(
      displayPath("/app", join("/app", ".design-system-axi", "catalog.json")),
    ).toBe(join(".design-system-axi", "catalog.json"));
    expect(displayPath("/app", "/elsewhere/catalog.json")).toBe(
      "/elsewhere/catalog.json",
    );
  });
});

describe("suggestNames", () => {
  const names = ["Button", "ButtonGroup", "Banner", "Avatar"];

  it("suggests close spellings", () => {
    expect(suggestNames("Buton", names)).toEqual(["Button"]);
  });

  it("puts prefix matches first", () => {
    expect(suggestNames("butt", names)).toEqual(["Button", "ButtonGroup"]);
  });

  it("returns nothing for unrelated input", () => {
    expect(suggestNames("zzzzzz", names)).toEqual([]);
  });

  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});
