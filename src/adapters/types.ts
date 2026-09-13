import type { Example, Prop, Status, Subcomponent } from "../catalog/schema.js";

export type AdapterId = "storybook" | "primer-components-json";

export interface FragmentComponent {
  /** Adapter-local id: a Storybook entry id or a Primer component id. */
  key: string;
  name: string;
  /** False for entries that are not a real exported component (story groupings, hooks). */
  isComponent: boolean;
  /** Storybook story ids, the cross-source join key. */
  storyIds: string[];
  import?: string;
  status?: Status;
  description?: string;
  deprecation?: string;
  props?: Prop[];
  subcomponents?: Subcomponent[];
  examples?: Example[];
}

export interface SourceFragment {
  adapter: AdapterId;
  location: string;
  /** Higher priority wins field precedence during merge. */
  priority: number;
  /** True when every entry is its own component, so two entries of this fragment never merge. */
  distinctEntries: boolean;
  designSystem?: { name?: string; package?: string; version?: string };
  components: FragmentComponent[];
}
