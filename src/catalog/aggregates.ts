import {
  type Aggregates,
  type Component,
  STATUSES,
  type Status,
} from './schema.js';

export function computeAggregates(components: Component[]): Aggregates {
  const byStatus = Object.fromEntries(
    STATUSES.map(status => [status, 0]),
  ) as Record<Status, number>;
  let examples = 0;
  let props = 0;
  for (const component of components) {
    byStatus[component.status] += 1;
    examples += component.examples.length;
    props += component.props.length;
  }
  return { components: components.length, byStatus, examples, props };
}
