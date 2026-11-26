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

/**
 * A new ULID. The 16 random characters are drawn fresh every time, so ids
 * made in the same millisecond share only their time prefix, never a run of
 * random characters. (The spec's optional "monotonic" mode increments the
 * last id instead, which makes a batch look like a counter; we don't use it.)
 * Ids that share a millisecond don't sort among themselves. `now` and
 * `random` are for tests.
 */
export function ulid(
  now: number = Date.now(),
  random: (n: number) => Uint8Array = (n) =>
    crypto.getRandomValues(new Uint8Array(n)),
): string {
  // 256 is a multiple of 32, so each byte mod 32 is uniform.
  const rand = Array.from(random(16), (b) => ALPHABET[b % 32]).join("");
  return encodeTime(now) + rand;
}

/** The millisecond timestamp a ULID was made at. */
export function ulidTime(id: string): number {
  if (!ULID.test(id)) throw new Error(`not a ULID: ${id}`);
  let ms = 0;
  for (const c of id.slice(0, 10)) ms = ms * 32 + ALPHABET.indexOf(c);
  return ms;
}
