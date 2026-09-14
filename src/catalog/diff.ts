import type { Catalog, Component } from "./schema.js";

export function describeChanges(
  previous: Catalog | undefined,
  next: Catalog,
): string {
  if (!previous) return "initial sync";
  const before = new Map(
    previous.components.map((component) => [
      component.id,
      fingerprint(component),
    ]),
  );
  const after = new Map(
    next.components.map((component) => [component.id, fingerprint(component)]),
  );
  let added = 0;
  let removed = 0;
  let changed = 0;
  for (const [id, print] of after) {
    const old = before.get(id);
    if (old === undefined) added += 1;
    else if (old !== print) changed += 1;
  }
  for (const id of before.keys()) if (!after.has(id)) removed += 1;
  if (added + removed + changed === 0) return "none";
  return `added ${added}, removed ${removed}, changed ${changed}`;
}

function fingerprint(component: Component): string {
  const { provenance: _provenance, ...rest } = component;
  return JSON.stringify(rest);
}
