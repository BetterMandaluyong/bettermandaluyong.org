// A person's name in parts, and how the site writes it out. The parts follow
// the DILG Barangay Officials Directory's columns (first, middle, last,
// suffix), plus the nickname the city shows in quotes.

/** A person's name, as stored under `name:` in `data/people/<id>.yaml`. */
export type PersonName = {
  /** Given name(s), e.g. "Charisse Marie" or "Ma. Consuelo". */
  first_name: string;
  /** Usually the mother's maiden surname, in full ("Parong") or as an initial ("O."). */
  middle_name?: string;
  /** Surname, e.g. "De Guzman", "Sta. Maria", "Abalos-Vargas". */
  last_name: string;
  /** As written: "Jr.", "Jr", "III". */
  suffix?: string;
  /** Shown in quotes after the first name, e.g. "Queenie". */
  nickname?: string;
};

/** The fields of `PersonName`, in the order person files list them. */
export const NAME_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "suffix",
  "nickname",
] as const;

/**
 * The name as the site shows it: first, “nickname”, middle, last, suffix,
 * e.g. "Alexandria “Queenie” Pahati-Gonzales" or "Pedrito C. Catanyag Jr.".
 */
export function displayName(n: PersonName): string {
  return [
    n.first_name,
    n.nickname && `“${n.nickname}”`,
    n.middle_name,
    n.last_name,
    n.suffix,
  ]
    .filter(Boolean)
    .join(" ");
}

const SUFFIX = /^(Jr\.?|Sr\.?|II|III|IV|V)$/i;
/** A middle initial: one letter ("R.", "E") or two with a dot ("DG.", not "De"). */
const INITIAL = /^([A-Za-zÑñ]\.?|[A-Za-zÑñ]{2}\.)$/;

/**
 * Splits a written name into parts where its shape decides it, for new
 * people the importer finds. A nickname in “quotes” and a trailing suffix
 * are taken off first. Then:
 * - two words are first and last name;
 * - a middle initial ("R.") marks the middle name: words before it are the
 *   first name, words after it the last name ("Ma." is never an initial).
 *
 * Anything else ("Kent Gajo Faminial": is Gajo a second given name or a
 * middle name?) is `certain: false`, split as first name(s) and a one-word
 * last name, for a person to check against an official list such as DILG's.
 */
export function splitName(written: string): {
  name: PersonName;
  certain: boolean;
} {
  let rest = written.trim();
  let nickname: string | undefined;
  const quoted = rest.match(/\s*“([^”]+)”\s*/);
  if (quoted) {
    nickname = quoted[1];
    rest = `${rest.slice(0, quoted.index)} ${rest.slice(quoted.index! + quoted[0].length)}`;
  }
  const words = rest.replace(/,(\s)/g, "$1").split(/\s+/).filter(Boolean);
  let suffix: string | undefined;
  if (words.length > 2 && SUFFIX.test(words.at(-1)!)) suffix = words.pop();
  const extra = {
    ...(suffix ? { suffix } : {}),
    ...(nickname ? { nickname } : {}),
  };
  if (words.length === 2) {
    return {
      name: { first_name: words[0], last_name: words[1], ...extra },
      certain: true,
    };
  }
  const initials = words
    .map((w, i) => i)
    .filter(
      (i) =>
        i > 0 &&
        i < words.length - 1 &&
        INITIAL.test(words[i]) &&
        words[i].toLowerCase() !== "ma.",
    );
  if (initials.length > 0) {
    const i = initials.at(-1)!;
    return {
      name: {
        first_name: words.slice(0, i).join(" "),
        middle_name: words[i],
        last_name: words.slice(i + 1).join(" "),
        ...extra,
      },
      certain: true,
    };
  }
  return {
    name: {
      first_name: words.slice(0, -1).join(" "),
      last_name: words.at(-1) ?? "",
      ...extra,
    },
    certain: false,
  };
}
