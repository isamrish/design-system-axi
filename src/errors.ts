import { AxiError } from "axi-sdk-js";

export const BIN = "design-system-axi";
export const ISSUES_URL =
  "https://github.com/isamrish/design-system-axi/issues";

export function validationError(message: string, command?: string): AxiError {
  const help = command
    ? `Run \`${BIN} ${command} --help\``
    : `Run \`${BIN} --help\``;
  return new AxiError(message, "VALIDATION_ERROR", [help]);
}

export function noCatalog(path: string): AxiError {
  return new AxiError(`no catalog at ${path}`, "NO_CATALOG", [
    `Run \`${BIN} sync --storybook <url|dir> --primer <dir>\``,
  ]);
}

export function notFound(name: string, suggestions: string[]): AxiError {
  const help =
    suggestions.length > 0
      ? [`did you mean: ${suggestions.join(", ")}`]
      : [`Run \`${BIN} find "<intent>"\` to search by purpose`];
  return new AxiError(`no component "${name}"`, "NOT_FOUND", help);
}

export function sourceUnreachable(location: string, reason: string): AxiError {
  return new AxiError(
    `cannot read ${location} (${reason})`,
    "SOURCE_UNREACHABLE",
    [
      "Storybook manifests need Storybook >= 10 with features.componentsManifest",
    ],
  );
}

export function manifestShape(
  adapter: string,
  path: string,
  reason: string,
): AxiError {
  return new AxiError(
    `unrecognized ${adapter} data at ${path}: ${reason}`,
    "MANIFEST_SHAPE",
    [`Report at ${ISSUES_URL}`],
  );
}

export function catalogInvalid(message: string, suggestion: string): AxiError {
  return new AxiError(message, "CATALOG_INVALID", [suggestion]);
}
