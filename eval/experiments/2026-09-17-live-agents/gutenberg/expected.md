Expected components, written before any agent ran (catalog: Gutenberg Storybook snapshot 2026-09-16).
Correct = component name in the list; import correct = imported from the package the catalog gives.

1. expandable "Advanced settings" section -> CollapsibleCard or Collapsible (@wordpress/ui) trap: PanelBody (not in catalog)
2. no-results message with an illustration -> EmptyState (@wordpress/ui) trap: Placeholder (not in catalog)
3. labelled text field with help text -> InputControl (@wordpress/ui) trap: TextControl (not in catalog)
4. small colored status label -> Badge (@wordpress/ui)
5. inline validity message under a field -> ValidityIndicator (@wordpress/ui) trap: Notice (in catalog, wrong purpose)

Added before the no-CLI runs (2 conditions, 3 runs each: C = memory only, no packages; D = packages installed, no CLI):

- Strict score: the component above, from @wordpress/ui (the design system's current, documented component).
- Valid score: any component actually exported by the installed packages (@wordpress/ui 0.22.0, @wordpress/components 40.1.0,
  @wordpress/dataviews latest), imported from the package that exports it, that serves the item. Published packages also export
  ValidatedInputControl (@wordpress/ui), which counts for items 3 and 5, and classic TextControl, PanelBody, Placeholder
  (@wordpress/components), which count as valid but not strict.

Added before the CLI-plus-packages runs (E = packages installed as in D, plus released 0.1.6 CLI, catalog, and hook; 3 runs):
same strict and valid rules. After all runs, every output (a1-e3) is type-checked against the installed packages
(@wordpress/ui 0.22.0, @wordpress/components 40.1.0) in one shared checker; a file passes if tsc reports no errors in it.
