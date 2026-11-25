import type { Barangay } from "../../data/schema.ts";

/** One barangay that matched a search, and the official who matched, if any. */
export type SearchHit = {
  barangay: Barangay;
  /** Set when the barangay matched through a person, not its own name/ZIP. */
  official?: { name: string; role: string };
};

/** Lowercase, accents folded, punctuation turned into spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A one-character token must equal a word; longer ones may start one. */
function tokenMatches(token: string, words: readonly string[]): boolean {
  return words.some((w) =>
    token.length < 2 ? w === token : w.startsWith(token),
  );
}

function allTokensMatch(tokens: readonly string[], text: string): boolean {
  const words = text.split(" ");
  return tokens.every((t) => tokenMatches(t, words));
}

/**
 * Finds barangays matching `query`, keeping the input order. Every word of
 * the query must match the start of a word in the barangay's name, its ZIP,
 * "district 1" or "district 2", or (all within one person) an official's name
 * or position. Case and accents don't matter. An empty query matches
 * everything.
 */
export function searchBarangays(
  barangays: readonly Barangay[],
  query: string,
): SearchHit[] {
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return barangays.map((barangay) => ({ barangay }));

  const hits: SearchHit[] = [];
  for (const barangay of barangays) {
    const own = normalize(
      `${barangay.name} ${barangay.zip} district ${barangay.district}`,
    );
    if (allTokensMatch(tokens, own)) {
      hits.push({ barangay });
      continue;
    }
    const people = [
      { name: barangay.captain, role: "Punong Barangay" },
      ...barangay.kagawads.map((name) => ({ name, role: "Barangay Kagawad" })),
      { name: barangay.skChair, role: "SK Chairperson" },
      ...barangay.skKagawads.map((name) => ({ name, role: "SK Kagawad" })),
    ];
    const official = people.find((p) =>
      allTokensMatch(tokens, normalize(p.name)),
    );
    if (official) hits.push({ barangay, official });
  }
  return hits;
}
