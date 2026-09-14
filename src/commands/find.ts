import { intFlag, parseCommandArgs } from '../args.js';
import { requireCatalog } from '../catalog/store.js';
import { BIN, validationError } from '../errors.js';
import { buildIndex, search } from '../search/rank.js';
import type { CommandContext } from './context.js';

const FLAGS = { limit: { type: 'string' } } as const;
const USAGE = 'usage: design-system-axi find "<intent>" [--limit <n>]';
const DEFAULT_LIMIT = 5;

export async function findCommand(
  args: string[],
  ctx: CommandContext,
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseCommandArgs('find', args, FLAGS);
  const intent = positionals.join(' ').trim();
  if (!intent) throw validationError(USAGE, 'find');
  const limit = intFlag('find', 'limit', flags.limit, DEFAULT_LIMIT);
  const { catalog } = await requireCatalog(ctx);

  const matches = search(buildIndex(catalog.components), intent, limit);
  const output: Record<string, unknown> = {
    intent,
    matches: matches.map(match => ({
      component: match.component.name,
      status: match.component.status,
      match: match.strength,
      why: match.why,
    })),
  };

  const top = matches[0]?.component;
  if (!top) {
    output.result = `no components match "${intent}"`;
    output.help = [
      `Run \`${BIN} components\` to browse all components`,
      'Try other words for what the UI does',
    ];
    return output;
  }
  const shared =
    catalog.components.filter(component => component.name === top.name).length >
    1;
  const ref = shared ? `${top.id} --id` : top.name;
  if (matches.every(match => match.strength === 'weak')) {
    output.result = `no strong match for "${intent}"; these components only partly match`;
    output.help = [
      `Run \`${BIN} component ${ref}\` to check whether it fits`,
      `Run \`${BIN} components\` to browse all components`,
    ];
    return output;
  }
  output.help = [
    `Run \`${BIN} component ${ref}\` for props, import, and an example`,
  ];
  return output;
}
