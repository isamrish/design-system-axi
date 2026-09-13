import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/primer/${path}`, import.meta.url), "utf8"),
  );

describe("primer fixtures", () => {
  it("contains the Storybook components manifest", () => {
    const manifest = read("storybook/manifests/components.json");
    expect(typeof manifest.v).toBe("number");
    expect(Object.keys(manifest.components)).toHaveLength(210);
  });

  it("contains the Primer package metadata", () => {
    expect(read("package/package.json")).toMatchObject({
      name: "@primer/react",
      version: "38.39.0",
    });
    expect(
      Object.keys(read("package/generated/components.json").components),
    ).toHaveLength(80);
  });
});
