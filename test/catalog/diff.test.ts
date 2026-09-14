import { describe, expect, it } from "vitest";
import { describeChanges } from "../../src/catalog/diff.js";
import { makeCatalog, makeComponent } from "../helpers/catalog.js";

const button = makeComponent({ id: "button", name: "Button" });
const banner = makeComponent({ id: "banner", name: "Banner" });

describe("describeChanges", () => {
  it("reports an initial sync", () => {
    expect(describeChanges(undefined, makeCatalog([button]))).toBe(
      "initial sync",
    );
  });

  it("reports none when only provenance or sync time differ", () => {
    const next = makeCatalog(
      [{ ...button, provenance: { import: "storybook" } }],
      { syncedAt: "2026-09-13T00:00:00.000Z" },
    );
    expect(describeChanges(makeCatalog([button]), next)).toBe("none");
  });

  it("counts added, removed, and changed components by id", () => {
    const previous = makeCatalog([button, banner]);
    const next = makeCatalog([
      { ...button, status: "beta" },
      makeComponent({ id: "avatar", name: "Avatar" }),
    ]);
    expect(describeChanges(previous, next)).toBe(
      "added 1, removed 1, changed 1",
    );
  });
});
