import type {
  AdapterId,
  FragmentComponent,
  SourceFragment,
} from "../adapters/types.js";
import type { Component, Example, Status } from "./schema.js";

interface Member {
  adapter: AdapterId;
  entry: FragmentComponent;
}

interface Group {
  members: Member[];
}

export interface MergeResult {
  components: Component[];
  skipped: number;
}

const RELATED_LIMIT = 5;

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function mergeFragments(fragments: SourceFragment[]): MergeResult {
  const ordered = [...fragments].sort((a, b) => b.priority - a.priority);
  const groups: Group[] = [];
  const byStory = new Map<string, Group>();
  let skipped = 0;

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
        group.members.some((member) => member.adapter === fragment.adapter)
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

    pending.sort((a, b) => compareStrings(a.key, b.key));
    for (const entry of pending) {
      const group =
        (fragment.distinctEntries
          ? undefined
          : prefixMatch(entry.key, placed)) ??
        nameMatch(entry.name, groups.filter(eligible));
      if (group) {
        attach(group, fragment.adapter, entry);
        placed.set(entry.key, group);
        continue;
      }
      if (!entry.isComponent) {
        skipped += 1;
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
  return { components, skipped };
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
): Group | undefined {
  let bestKey: string | undefined;
  for (const candidate of placed.keys()) {
    if (
      key.startsWith(`${candidate}-`) &&
      (bestKey === undefined || candidate.length > bestKey.length)
    )
      bestKey = candidate;
  }
  return bestKey === undefined ? undefined : placed.get(bestKey);
}

function nameMatch(name: string, groups: Group[]): Group | undefined {
  const same = groups.filter((group) => group.members[0]?.entry.name === name);
  if (same.length === 1) return same[0];
  const current = same.filter(
    (group) =>
      group.members.find((m) => m.entry.status)?.entry.status !== "deprecated",
  );
  return current.length === 1 ? current[0] : undefined;
}

function toComponent(group: Group): Component {
  const head = group.members[0];
  if (!head) throw new Error("empty merge group");
  const provenance: Record<string, string> = {};

  const scalar = (
    field: "import" | "status" | "description" | "deprecation",
  ): string => {
    for (const member of group.members) {
      const value = member.entry[field];
      if (value) {
        provenance[field] = member.adapter;
        return value;
      }
    }
    return "";
  };

  const list = <T>(
    field: "props" | "subcomponents",
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
    import: scalar("import"),
    status: (scalar("status") || "unknown") as Status,
    description: scalar("description"),
    deprecation: scalar("deprecation"),
    props: list("props", (entry) => entry.props),
    subcomponents: list("subcomponents", (entry) => entry.subcomponents),
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
  return [...byId.values()].map((example) => ({
    ...example,
    name: example.name || nameFromStoryId(example.id),
  }));
}

export function nameFromStoryId(id: string): string {
  const slug = id.split("--").at(-1) ?? id;
  const words = slug.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function addRelated(components: Component[]): void {
  const names = [...new Set(components.map((component) => component.name))];
  const patterns = new Map(
    names.map((name) => [name, new RegExp(`<${name}[\\s>/]`, "g")]),
  );
  for (const component of components) {
    const text = component.examples
      .map((example) => example.snippet)
      .join("\n");
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
