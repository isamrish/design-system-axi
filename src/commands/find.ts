import { intFlag, parseCommandArgs } from "../args.js";
import { requireCatalog } from "../catalog/store.js";
import { BIN, validationError } from "../errors.js";
import { buildIndex, search } from "../search/rank.js";
import type { CommandContext } from "./context.js";

const FLAGS = { limit: { type: "string" } } as const;
const USAGE = 'usage: design-system-axi find "<intent>" [--limit <n>]';
const DEFAULT_LIMIT = 5;

export async function findCommand(
  args: string[],
  ctx: CommandContext,
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseCommandArgs("find", args, FLAGS);
  const intent = positionals.join(" ").trim();
  if (!intent) throw validationError(USAGE, "find");
  const limit = intFlag("find", "limit", flags.limit, DEFAULT_LIMIT);
  const { catalog } = await requireCatalog(ctx);

  const matches = search(buildIndex(catalog.components), intent, limit);
  const output: Record<string, unknown> = {
    intent,
    matches: matches.map((match) => ({
      component: match.component.name,
      status: match.component.status,
      score: match.score,
      why: match.why,
    })),
  };

  const top = matches[0]?.component;
  if (!top) {
    output.result = `no components match "${intent}"`;
    output.help = [
      `Run \`${BIN} components\` to browse all components`,
      "Try other words for what the UI does",
    ];
    return output;
  }
  const shared =
    catalog.components.filter((component) => component.name === top.name)
      .length > 1;
  output.help = [
    `Run \`${BIN} component ${shared ? `${top.id} --id` : top.name}\` for props, import, and an example`,
  ];
  return output;
}
