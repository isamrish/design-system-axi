import { stem } from "./tokenize.js";

/** Curated groups of words agents use for the same UI purpose. Every change is logged in eval/LOG.md. */
const GROUPS: string[][] = [
  ["delete", "remove", "destroy", "destructive", "danger", "discard"],
  ["confirm", "confirmation", "approve", "verify"],
  ["modal", "dialog", "popup", "overlay", "lightbox"],
  ["dropdown", "menu", "select", "picker", "combobox", "pick"],
  ["loading", "spinner", "busy", "pending", "progress", "skeleton"],
  ["notification", "alert", "banner", "flash", "message", "toast"],
  ["error", "critical", "danger", "invalid", "failure"],
  ["success", "done", "complete"],
  ["warning", "caution", "attention"],
  ["tab", "tabs", "underline", "segment"],
  ["navigation", "nav", "sidebar", "menu", "link"],
  ["input", "field", "textbox", "text", "form", "textarea"],
  ["toggle", "switch", "checkbox", "off"],
  ["tooltip", "hint", "help", "hover"],
  ["empty", "blankslate", "zero", "none", "placeholder"],
  ["avatar", "profile", "picture", "photo"],
  ["table", "grid", "rows", "columns", "datatable"],
  ["badge", "label", "tag", "token", "counter", "count"],
  ["page", "layout", "header", "title"],
  ["tree", "hierarchy", "nested", "folder", "file"],
  ["pagination", "paginate", "pages", "next", "previous"],
  ["breadcrumb", "breadcrumbs", "trail"],
  ["radio", "choice", "option", "choose"],
  ["search", "filter", "find", "query"],
];

const INDEX = new Map<string, Set<string>>();
for (const group of GROUPS) {
  const stems = [...new Set(group.map(stem))];
  for (const term of stems) {
    const related = INDEX.get(term) ?? new Set<string>();
    for (const other of stems) if (other !== term) related.add(other);
    INDEX.set(term, related);
  }
}

export function synonymsOf(term: string): string[] {
  return [...(INDEX.get(term) ?? [])].sort();
}
