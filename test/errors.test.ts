import { AxiError } from "axi-sdk-js";
import { describe, expect, it } from "vitest";
import {
  catalogInvalid,
  manifestShape,
  noCatalog,
  notFound,
  sourceUnreachable,
  validationError,
} from "../src/errors.js";

describe("error factories", () => {
  it("builds each code with its suggestions", () => {
    const cases: [AxiError, string, string, string[]][] = [
      [
        validationError("bad", "find"),
        "VALIDATION_ERROR",
        "bad",
        ["Run `design-system-axi find --help`"],
      ],
      [
        validationError("bad"),
        "VALIDATION_ERROR",
        "bad",
        ["Run `design-system-axi --help`"],
      ],
      [
        noCatalog("/x/catalog.json"),
        "NO_CATALOG",
        "no catalog at /x/catalog.json",
        ["Run `design-system-axi sync --storybook <url|dir> --primer <dir>`"],
      ],
      [
        notFound("Buton", ["Button", "ButtonGroup"]),
        "NOT_FOUND",
        'no component "Buton"',
        ["did you mean: Button, ButtonGroup"],
      ],
      [
        notFound("Zzz", []),
        "NOT_FOUND",
        'no component "Zzz"',
        ['Run `design-system-axi find "<intent>"` to search by purpose'],
      ],
      [
        sourceUnreachable(
          "https://x/manifests/components.json",
          "HTTP 404",
          "Check the Storybook URL",
        ),
        "SOURCE_UNREACHABLE",
        "cannot read https://x/manifests/components.json (HTTP 404)",
        ["Check the Storybook URL"],
      ],
      [
        manifestShape("storybook", "components.x.stories", "expected array"),
        "MANIFEST_SHAPE",
        "unrecognized storybook data at components.x.stories: expected array",
        ["Report at https://github.com/isamrish/design-system-axi/issues"],
      ],
      [
        catalogInvalid(
          "catalog at /x is invalid",
          "Run `design-system-axi sync`",
        ),
        "CATALOG_INVALID",
        "catalog at /x is invalid",
        ["Run `design-system-axi sync`"],
      ],
    ];
    for (const [error, code, message, suggestions] of cases) {
      expect(error).toBeInstanceOf(AxiError);
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.suggestions).toEqual(suggestions);
    }
  });
});
