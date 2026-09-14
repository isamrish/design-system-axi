import { describe, expect, it } from "vitest";
import { synonymsOf } from "../../src/search/synonyms.js";
import { stem, tokenize } from "../../src/search/tokenize.js";

describe("tokenize", () => {
  it("splits camelCase and punctuation, lowercases, drops stopwords, and stems plurals", () => {
    expect(tokenize("ConfirmationDialog")).toEqual(["confirmation", "dialog"]);
    expect(tokenize("Confirm before deleting the repositories")).toEqual([
      "confirm",
      "deleting",
      "repository",
    ]);
    expect(tokenize("IconButton aria-label")).toEqual([
      "icon",
      "button",
      "aria",
      "label",
    ]);
    expect(tokenize("HTMLInput")).toEqual(["html", "input"]);
  });

  it("stems only plurals", () => {
    expect(stem("tabs")).toBe("tab");
    expect(stem("class")).toBe("class");
    expect(stem("bus")).toBe("bus");
    expect(stem("entries")).toBe("entry");
  });
});

describe("synonymsOf", () => {
  it("returns the other stemmed members of every group containing the term", () => {
    expect(synonymsOf("delete")).toEqual(
      expect.arrayContaining(["danger", "destructive", "remove"]),
    );
    expect(synonymsOf("delete")).not.toContain("delete");
    expect(synonymsOf("tab")).toContain("underline");
    expect(synonymsOf("zzz")).toEqual([]);
  });
});
