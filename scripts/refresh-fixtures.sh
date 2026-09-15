#!/usr/bin/env bash
# Recreates the real Primer fixtures, plus the WordPress slice that covers compound components.
# Counts and names asserted in tests are pinned to the committed files; both Storybooks track their
# project's main branch, so a refresh may require updating those expectations.
set -euo pipefail

PRIMER_VERSION="${PRIMER_VERSION:-38.39.0}"
STORYBOOK_URL="${STORYBOOK_URL:-https://primer.style/react/storybook}"
WORDPRESS_URL="${WORDPRESS_URL:-https://wordpress.github.io/gutenberg}"
# Entries kept from the 2 MB Gutenberg manifest: compound components, an entry whose component is in
# the second import statement, and two plain components.
WORDPRESS_ENTRIES="${WORDPRESS_ENTRIES:-design-system-components-tabs design-system-components-card components-togglecontrol dataviews-dataviewspicker components-button components-modal}"

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/test/fixtures/primer"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$out/storybook/manifests" "$out/package/generated"
curl -fsSL "$STORYBOOK_URL/manifests/components.json" -o "$out/storybook/manifests/components.json"
(cd "$tmp" && npm pack "@primer/react@$PRIMER_VERSION" --silent >/dev/null)
tar -xzf "$tmp"/primer-react-*.tgz -C "$tmp"
cp "$tmp/package/package.json" "$out/package/package.json"
cp "$tmp/package/generated/components.json" "$out/package/generated/components.json"

wordpress="$root/test/fixtures/wordpress/storybook/manifests"
mkdir -p "$wordpress"
curl -fsSL "$WORDPRESS_URL/manifests/components.json" -o "$tmp/wordpress.json"
node -e '
const full = require(process.argv[1]);
const keep = process.argv[3].split(" ");
const components = Object.fromEntries(
  keep.filter(id => full.components[id]).map(id => [id, full.components[id]]),
);
require("node:fs").writeFileSync(
  process.argv[2],
  JSON.stringify({ v: full.v, components }, null, "\t"),
);
const missing = keep.filter(id => !full.components[id]);
if (missing.length) console.log("missing entries:", missing.join(", "));
console.log("wordpress entries:", Object.keys(components).length);
' "$tmp/wordpress.json" "$wordpress/components.json" "$WORDPRESS_ENTRIES"

node -e '
const sb = require(process.argv[1]);
const pr = require(process.argv[2]);
console.log("storybook entries:", Object.keys(sb.components).length);
console.log("primer components:", Object.keys(pr.components).length);
' "$out/storybook/manifests/components.json" "$out/package/generated/components.json"
