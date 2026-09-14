import { parseCommandArgs } from '../args.js';
import type { Component, Prop, Subcomponent } from '../catalog/schema.js';
import { requireCatalog } from '../catalog/store.js';
import { BIN, notFound, validationError } from '../errors.js';
import { suggestNames } from '../format/suggest.js';
import { importSource, oneLine, truncate } from '../format/text.js';
import type { CommandContext } from './context.js';

const FLAGS = { id: { type: 'boolean' }, full: { type: 'boolean' } } as const;
const USAGE = 'usage: design-system-axi component <Name> [--id] [--full]';
const PROP_LIMIT = 8;
const TYPE_LIMIT = 60;
const DESCRIPTION_LIMIT = 300;
const EXAMPLE_LIMIT = 600;
/** Sources list documented props only; say so, so agents check the types before assuming a prop is unsupported. */
const PROPS_NOTE =
  'documented props only; inherited props and HTML attributes may be missing';

type Output = Record<string, unknown>;

export async function componentCommand(
  args: string[],
  ctx: CommandContext,
): Promise<Output> {
  const { positionals, flags } = parseCommandArgs('component', args, FLAGS);
  const query = positionals[0];
  if (positionals.length !== 1 || query === undefined)
    throw validationError(USAGE, 'component');
  const full = flags.full === true;
  const { catalog } = await requireCatalog(ctx);
  const components = catalog.components;

  if (flags.id === true) {
    const match = components.find(component => component.id === query);
    if (!match)
      throw notFound(
        query,
        suggestNames(
          query,
          components.map(component => component.id),
        ),
      );
    return describeComponent(match, [], full, `${match.id} --id`);
  }

  const lower = query.toLowerCase();
  const [primary, ...others] = components
    .filter(component => component.name.toLowerCase() === lower)
    .sort(preferCurrent);
  if (primary) return describeComponent(primary, others, full, primary.name);

  for (const parent of [...components].sort(preferCurrent)) {
    const sub = parent.subcomponents.find(
      candidate => candidate.name.toLowerCase() === lower,
    );
    if (sub) return describeSubcomponent(parent, sub, full);
  }

  const names = components.flatMap(component => [
    component.name,
    ...component.subcomponents.map(sub => sub.name),
  ]);
  throw notFound(query, suggestNames(query, names));
}

export function orderProps(props: Prop[]): Prop[] {
  const literal = (prop: Prop) => (/['"]/.test(prop.type) ? 1 : 0);
  return [...props].sort(
    (a, b) =>
      Number(b.required) - Number(a.required) ||
      literal(b) - literal(a) ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
}

function describeComponent(
  component: Component,
  others: Component[],
  full: boolean,
  ref: string,
): Output {
  const output: Output = {
    name: component.name,
    status: component.status,
    import: component.import,
  };
  if (component.description) {
    const description = oneLine(component.description);
    output.description = full
      ? description
      : truncate(description, DESCRIPTION_LIMIT);
    if (!full && description.length > DESCRIPTION_LIMIT) {
      output.description_shown = shownHint(
        DESCRIPTION_LIMIT,
        description.length,
      );
    }
  }
  if (component.deprecation) output.deprecated = oneLine(component.deprecation);
  Object.assign(output, propsSection(component.props, full));
  if (full) {
    output.examples = component.examples.map(example => ({
      name: example.name,
      snippet: example.snippet,
    }));
  } else {
    const example = component.examples.find(candidate => candidate.snippet);
    output.example = example ? truncate(example.snippet, EXAMPLE_LIMIT) : '';
    if (example && example.snippet.length > EXAMPLE_LIMIT) {
      output.example_shown = shownHint(EXAMPLE_LIMIT, example.snippet.length);
    }
    output.examples_total = component.examples.length;
  }
  output.subcomponents = component.subcomponents.map(sub => sub.name);
  output.related = component.related;
  if (others.length > 0) {
    output.other_matches = others.map(other => ({
      id: other.id,
      status: other.status,
      from: importSource(other.import),
    }));
  }

  const help: string[] = [];
  if (!full)
    help.push(
      `Run \`${BIN} component ${ref} --full\` for all ${component.props.length} props and ${component.examples.length} examples`,
    );
  const firstSub = component.subcomponents[0];
  if (firstSub)
    help.push(
      `Run \`${BIN} component ${firstSub.name}\` for subcomponent props`,
    );
  if (others.length > 0)
    help.push(`Run \`${BIN} component <id> --id\` for another match`);
  if (component.status === 'deprecated')
    help.push(
      `Run \`${BIN} find "<what you are building>"\` for a current alternative`,
    );
  if (help.length === 0)
    help.push(
      `Run \`${BIN} find "<what you are building>"\` to compare components`,
    );
  output.help = help;
  return output;
}

function describeSubcomponent(
  parent: Component,
  sub: Subcomponent,
  full: boolean,
): Output {
  return {
    name: sub.name,
    parent: parent.name,
    status: parent.status,
    import: parent.import,
    ...propsSection(sub.props, full),
    help: [`Run \`${BIN} component ${parent.name}\` for the parent component`],
  };
}

/** `truncate` keeps limit - 1 characters and adds an ellipsis. */
function shownHint(limit: number, length: number): string {
  return `${limit - 1} of ${length} chars (use --full)`;
}

function propsSection(props: Prop[], full: boolean): Output {
  if (full) {
    return {
      props: props.map(prop => ({
        name: prop.name,
        type: oneLine(prop.type),
        required: prop.required,
        default: prop.default,
        deprecated: prop.deprecated,
        description: oneLine(prop.description),
      })),
      props_note: PROPS_NOTE,
    };
  }
  const visible = orderProps(props.filter(prop => !prop.deprecated));
  const section: Output = {
    props: visible.slice(0, PROP_LIMIT).map(prop => ({
      name: prop.name,
      type: truncate(oneLine(prop.type), TYPE_LIMIT),
      default: prop.default,
    })),
  };
  if (visible.length > PROP_LIMIT)
    section.props_shown = `${PROP_LIMIT} of ${visible.length}`;
  const cutTypes = visible
    .slice(0, PROP_LIMIT)
    .filter(prop => oneLine(prop.type).length > TYPE_LIMIT).length;
  if (cutTypes > 0) {
    section.types_shown = `${cutTypes} prop ${cutTypes === 1 ? 'type' : 'types'} cut to ${TYPE_LIMIT - 1} chars (use --full)`;
  }
  section.props_note = PROPS_NOTE;
  return section;
}

function preferCurrent(a: Component, b: Component): number {
  const deprecated = (component: Component) =>
    component.status === 'deprecated' ? 1 : 0;
  return (
    deprecated(a) - deprecated(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
