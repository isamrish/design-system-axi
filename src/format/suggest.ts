const MAX_DISTANCE = 3;

export function suggestNames(
  input: string,
  candidates: string[],
  max = 3,
): string[] {
  const needle = input.toLowerCase();
  const scored = [...new Set(candidates)]
    .map((name) => {
      const hay = name.toLowerCase();
      return {
        name,
        prefix: hay.startsWith(needle) || needle.startsWith(hay),
        distance: levenshtein(needle, hay),
      };
    })
    .filter(
      (candidate) => candidate.prefix || candidate.distance <= MAX_DISTANCE,
    );
  scored.sort(
    (a, b) =>
      Number(b.prefix) - Number(a.prefix) ||
      a.distance - b.distance ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  return scored.slice(0, max).map((candidate) => candidate.name);
}

export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(above + 1, (row[j - 1] ?? 0) + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return row[b.length] ?? 0;
}
