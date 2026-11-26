// ULIDs (https://github.com/ulid/spec): 26-character ids that sort by the
// time they were made. Person files are named by one, following
// bettergovph/open-congress-data's convention. No dependencies.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A ULID: 10 time characters and 16 random ones, Crockford base32. */
export const ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

function encodeTime(ms: number): string {
  if (!Number.isInteger(ms) || ms < 0 || ms > 2 ** 48 - 1) {
    throw new Error(`ULID time out of range: ${ms}`);
  }
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ALPHABET[ms % 32] + out;
    ms = Math.floor(ms / 32);
  }
  return out;
}

/** The random part plus one, as base32 digits; throws if it would overflow. */
function increment(digits: readonly number[]): number[] {
  const next = [...digits];
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i] < 31) {
      next[i]++;
      return next;
    }
    next[i] = 0;
  }
  throw new Error("ULID random part overflowed within one millisecond");
}

/**
 * Returns a function that makes ULIDs. They are monotonic: each id sorts
 * after the one before it, even when made within the same millisecond (the
 * random part is incremented). `now` and `random` are for tests.
 */
export function ulidFactory(
  now: () => number = Date.now,
  random: (n: number) => Uint8Array = (n) =>
    crypto.getRandomValues(new Uint8Array(n)),
): () => string {
  let lastTime = -1;
  let last: number[] = [];
  return () => {
    const t = now();
    if (t > lastTime) {
      lastTime = t;
      // 256 is a multiple of 32, so each byte mod 32 is uniform.
      last = Array.from(random(16), (b) => b % 32);
    } else {
      last = increment(last);
    }
    return encodeTime(lastTime) + last.map((d) => ALPHABET[d]).join("");
  };
}

/** The millisecond timestamp a ULID was made at. */
export function ulidTime(id: string): number {
  if (!ULID.test(id)) throw new Error(`not a ULID: ${id}`);
  let ms = 0;
  for (const c of id.slice(0, 10)) ms = ms * 32 + ALPHABET.indexOf(c);
  return ms;
}
