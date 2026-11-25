/** One phone number as the city publishes it, with a dialable link if any. */
export type PhoneLink = {
  /** The number exactly as published, e.g. "8534-0503" or "8532-5001 local 847". */
  text: string;
  /** A `tel:` href in international form, or `null` if no number could be read. */
  href: string | null;
};

/** Where a number ends and its extension begins: "to 28", "local 847", "loc. 858". */
const EXTENSION = /\b(?:to|local|loc|ext)\b/i;

/**
 * Splits the city's phone text ("8534-0503 / 8706-1738", "8516-4308 & 0945-577-0438")
 * into one entry per number. A slash inside an extension ("local 577/578") does
 * not split, because only a slash followed by another full number does.
 */
export function parsePhones(raw: string): PhoneLink[] {
  return raw
    .split(/\s*(?:\/|&)\s*(?=\(?\d[\d-]{6,})/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text) => ({ text, href: telHref(text) }));
}

/**
 * The `tel:` href for one published number, or `null` if it isn't a Metro
 * Manila landline (8 digits) or a Philippine number with a leading 0
 * (mobile "09…" or "02…"). Only the part before an extension is dialled.
 */
export function telHref(text: string): string | null {
  const head = text.split(EXTENSION)[0];
  const digits = head.replace(/\D/g, "");
  if (digits.length === 8) return `tel:+632${digits}`;
  if (
    (digits.length === 11 || digits.length === 10) &&
    digits.startsWith("0")
  ) {
    return `tel:+63${digits.slice(1)}`;
  }
  return null;
}
