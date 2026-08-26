const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_SEARCH_CHARACTERS = /[^\p{L}\p{N}]+/gu;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLocaleLowerCase()
    .replace(NON_SEARCH_CHARACTERS, "");
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + substitutionCost,
      );
    }

    previous = current;
  }

  return previous[right.length] ?? Math.max(left.length, right.length);
}

function maximumEditDistance(queryLength: number): number {
  if (queryLength <= 4) return 1;
  return Math.min(3, Math.max(2, Math.floor(queryLength * 0.25)));
}

/**
 * Returns a higher-is-better score, or null when the candidate is too distant.
 * Comparing query-sized windows lets a typo match one word inside a product name.
 */
export function fuzzySearchScore(candidateValue: string, queryValue: string): number | null {
  const candidate = normalizeSearchText(candidateValue);
  const query = normalizeSearchText(queryValue);

  if (query.length < 2 || candidate.length === 0) return null;

  const substringIndex = candidate.indexOf(query);

  if (substringIndex >= 0) {
    return 1_000 - substringIndex * 5 - Math.max(0, candidate.length - query.length);
  }

  const maximumDistance = maximumEditDistance(query.length);
  const minimumWindowLength = Math.max(1, query.length - maximumDistance);
  const maximumWindowLength = Math.min(candidate.length, query.length + maximumDistance);
  let bestDistance = Number.POSITIVE_INFINITY;

  for (
    let windowLength = minimumWindowLength;
    windowLength <= maximumWindowLength;
    windowLength += 1
  ) {
    for (let start = 0; start + windowLength <= candidate.length; start += 1) {
      bestDistance = Math.min(
        bestDistance,
        levenshteinDistance(candidate.slice(start, start + windowLength), query),
      );

      if (bestDistance === 1) break;
    }
  }

  if (bestDistance > maximumDistance) return null;
  return 800 - bestDistance * 100 - Math.abs(candidate.length - query.length);
}

export function containsCjk(value: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value);
}
