#!/usr/bin/env bash
# Recreates the real Primer fixtures. Counts asserted in tests are pinned to the committed files;
# the deployed Storybook tracks Primer's main branch, so a refresh may require updating those counts.
set -euo pipefail

PRIMER_VERSION="${PRIMER_VERSION:-38.39.0}"
STORYBOOK_URL="${STORYBOOK_URL:-https://primer.style/react/storybook}"

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

node -e '
const sb = require(process.argv[1]);
const pr = require(process.argv[2]);
console.log("storybook entries:", Object.keys(sb.components).length);
console.log("primer components:", Object.keys(pr.components).length);
' "$out/storybook/manifests/components.json" "$out/package/generated/components.json"
