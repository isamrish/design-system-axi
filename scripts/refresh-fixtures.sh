#!/usr/bin/env bash
# Recreates the real Primer fixtures and WordPress Gutenberg's full Storybook manifest.
# Counts and names asserted in tests are pinned to the committed files; both Storybooks track their
# project's main branch, so a refresh may require updating those expectations.
set -euo pipefail

PRIMER_VERSION="${PRIMER_VERSION:-38.39.0}"
STORYBOOK_URL="${STORYBOOK_URL:-https://primer.style/react/storybook}"
WORDPRESS_URL="${WORDPRESS_URL:-https://wordpress.github.io/gutenberg}"

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
# The Gutenberg Storybook tracks trunk and has no version, so eval registration 4 names the fetch
# date of the committed snapshot; refreshing it means registering a new set.
curl -fsSL "$WORDPRESS_URL/manifests/components.json" -o "$wordpress/components.json"
node -e 'console.log("wordpress entries:", Object.keys(require(process.argv[1]).components).length)' "$wordpress/components.json"

node -e '
const sb = require(process.argv[1]);
const pr = require(process.argv[2]);
console.log("storybook entries:", Object.keys(sb.components).length);
console.log("primer components:", Object.keys(pr.components).length);
' "$out/storybook/manifests/components.json" "$out/package/generated/components.json"
