import type {
  AdapterId,
  FragmentComponent,
  SourceFragment,
} from '../adapters/types.js';
import type { Component, Example, Status } from './schema.js';

interface Member {
  adapter: AdapterId;
  entry: FragmentComponent;
}

interface Group {
  members: Member[];
}

export interface MergeResult {
  components: Component[];
  /** Adapter keys of entries that are not components and joined no component. */
  skipped: string[];
}

const RELATED_LIMIT = 5;

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function mergeFragments(fragments: SourceFragment[]): MergeResult {
  const ordered = [...fragments].sort((a, b) => b.priority - a.priority);
  const groups: Group[] = [];
  const byStory = new Map<string, Group>();
  const skipped: string[] = [];

  const attach = (
    group: Group,
    adapter: AdapterId,
    entry: FragmentComponent,
  ) => {
    group.members.push({ adapter, entry });
    for (const id of entry.storyIds)
      if (!byStory.has(id)) byStory.set(id, group);
  };

  for (const fragment of ordered) {
    const eligible = (group: Group) =>
      !(
        fragment.distinctEntries &&
        group.members.some(member => member.adapter === fragment.adapter)
      );
    const placed = new Map<string, Group>();
    const pending: FragmentComponent[] = [];

    for (const entry of fragment.components) {
      const group = storyMatch(entry, byStory, eligible);
      if (group) {
        attach(group, fragment.adapter, entry);
        placed.set(entry.key, group);
      } else {
        pending.push(entry);
      }
    }

    // Current entries first, so a deprecated one never founds a group that a
    // current entry with the same name then joins.
    pending.sort(
      (a, b) =>
        Number(isDeprecated(a)) - Number(isDeprecated(b)) ||
        compareStrings(a.key, b.key),
    );
    for (const entry of pending) {
      // Without a published story id linking them, a deprecated entry (often an
      // old API that shares its name) must not lend its examples to a current
      // component, so it joins by prefix or name only a deprecated one.
      const joinable = (group: Group) =>
        eligible(group) && (!isDeprecated(entry) || groupDeprecated(group));
      const group =
        (fragment.distinctEntries
          ? undefined
          : prefixMatch(entry.key, placed, joinable)) ??
        nameMatch(entry.name, groups.filter(joinable));
      if (group) {
        attach(group, fragment.adapter, entry);
        placed.set(entry.key, group);
        continue;
      }
      const shadowsCurrent =
        isDeprecated(entry) &&
        groups.some(
          g =>
            eligible(g) && !groupDeprecated(g) && groupName(g) === entry.name,
        );
      if (!entry.isComponent || shadowsCurrent) {
        skipped.push(entry.key);
        continue;
      }
      const created: Group = { members: [] };
      groups.push(created);
      attach(created, fragment.adapter, entry);
      placed.set(entry.key, created);
    }
  }

  const components = groups.map(toComponent);
  addRelated(components);
  components.sort(
    (a, b) => compareStrings(a.name, b.name) || compareStrings(a.id, b.id),
  );
  return { components, skipped: skipped.sort(compareStrings) };
}

function storyMatch(
  entry: FragmentComponent,
  byStory: Map<string, Group>,
  eligible: (group: Group) => boolean,
): Group | undefined {
  const counts = new Map<Group, number>();
  for (const id of entry.storyIds) {
    const group = byStory.get(id);
    if (group && eligible(group))
      counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  let best: Group | undefined;
  let bestCount = 0;
  for (const [group, count] of counts) {
    if (count > bestCount) {
      best = group;
      bestCount = count;
    }
  }
  return best;
}

function prefixMatch(
  key: string,
  placed: Map<string, Group>,
  joinable: (group: Group) => boolean,
): Group | undefined {
  let bestKey: string | undefined;
  for (const [candidate, group] of placed) {
    if (
      key.startsWith(`${candidate}-`) &&
      joinable(group) &&
      (bestKey === undefined || candidate.length > bestKey.length)
    )
      bestKey = candidate;
  }
  return bestKey === undefined ? undefined : placed.get(bestKey);
}

function nameMatch(name: string, groups: Group[]): Group | undefined {
  const same = groups.filter(group => groupName(group) === name);
  if (same.length === 1) return same[0];
  const current = same.filter(group => !groupDeprecated(group));
  return current.length === 1 ? current[0] : undefined;
}

function isDeprecated(entry: FragmentComponent): boolean {
  return entry.status === 'deprecated';
}

function groupName(group: Group): string | undefined {
  return group.members[0]?.entry.name;
}

/** A group's status comes from its first member that states one, as in toComponent. */
function groupDeprecated(group: Group): boolean {
  return group.members.find(m => m.entry.status)?.entry.status === 'deprecated';
}

function toComponent(group: Group): Component {
  const head = group.members[0];
  if (!head) throw new Error('empty merge group');
  const provenance: Record<string, string> = {};

  const scalar = (
    field: 'import' | 'status' | 'description' | 'deprecation',
  ): string => {
    for (const member of group.members) {
      const value = member.entry[field];
      if (value) {
        provenance[field] = member.adapter;
        return value;
      }
    }
    return '';
  };

  const list = <T>(
    field: 'props' | 'subcomponents',
    read: (entry: FragmentComponent) => T[] | undefined,
  ): T[] => {
    for (const member of group.members) {
      const value = read(member.entry);
      if (value && value.length > 0) {
        provenance[field] = member.adapter;
        return value;
      }
    }
    return [];
  };

  return {
    id: head.entry.key,
    name: head.entry.name,
    import: scalar('import'),
    status: (scalar('status') || 'unknown') as Status,
    description: scalar('description'),
    deprecation: scalar('deprecation'),
    props: list('props', entry => entry.props),
    subcomponents: list('subcomponents', entry => entry.subcomponents),
    examples: mergeExamples(group),
    related: [],
    provenance,
  };
}

function mergeExamples(group: Group): Example[] {
  const byId = new Map<string, Example>();
  for (const member of group.members) {
    for (const example of member.entry.examples ?? []) {
      const current = byId.get(example.id);
      if (!current) {
        byId.set(example.id, { ...example });
        continue;
      }
      if (!current.name && example.name) current.name = example.name;
      if (!current.snippet && example.snippet)
        current.snippet = example.snippet;
    }
  }
  return [...byId.values()].map(example => ({
    ...example,
    name: example.name || nameFromStoryId(example.id),
  }));
}

export function nameFromStoryId(id: string): string {
  const slug = id.split('--').at(-1) ?? id;
  const words = slug.split('-').filter(Boolean).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function escapeRegExp(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addRelated(components: Component[]): void {
  const names = [...new Set(components.map(component => component.name))];
  const patterns = new Map(
    names.map(name => [name, new RegExp(`<${escapeRegExp(name)}[\\s>/]`, 'g')]),
  );
  for (const component of components) {
    const text = component.examples.map(example => example.snippet).join('\n');
    const counts: [string, number][] = [];
    for (const name of names) {
      if (name === component.name) continue;
      const hits = text.match(patterns.get(name) as RegExp)?.length ?? 0;
      if (hits > 0) counts.push([name, hits]);
    }
    counts.sort((a, b) => b[1] - a[1] || compareStrings(a[0], b[0]));
    component.related = counts.slice(0, RELATED_LIMIT).map(([name]) => name);
  }
}
