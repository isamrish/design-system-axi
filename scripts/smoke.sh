#!/usr/bin/env bash
# Installs the packed CLI and runs it against live Primer sources. Needs network; not part of CI.
set -euo pipefail

PRIMER_VERSION="${PRIMER_VERSION:-38.39.0}"
STORYBOOK_URL="${STORYBOOK_URL:-https://primer.style/react/storybook}"

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

(cd "$root" && pnpm run build >/dev/null && pnpm pack --pack-destination "$work" >/dev/null)

cd "$work"
npm init -y >/dev/null
npm install --silent ./design-system-axi-*.tgz
# Unpack @primer/react without its dependency tree; only its metadata is read.
npm pack "@primer/react@$PRIMER_VERSION" --silent >/dev/null
mkdir -p node_modules/@primer/react
tar -xzf primer-react-*.tgz -C node_modules/@primer/react --strip-components=1

bin="$work/node_modules/.bin/design-system-axi"
run() {
  echo "\$ design-system-axi $*"
  "$bin" "$@"
  echo
}

run sync --storybook "$STORYBOOK_URL" --primer node_modules/@primer/react
run
run components --limit 5
run component Button
run find "confirm before deleting a repository"

home="$("$bin")"
grep -q "installed: $PRIMER_VERSION (matches)" <<<"$home"
not_found="$("$bin" component Buton || true)"
grep -q "code: NOT_FOUND" <<<"$not_found"
echo "smoke: ok"
