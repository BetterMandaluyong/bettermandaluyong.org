import type { CityOfficial } from "../data/city-officials.ts";
import { parsePhones } from "../utils/barangays/phone.ts";
import { BARANGAYS, mailto } from "./content.ts";

/** One person in an `OfficialList`. */
export type OfficialItem = {
  name: string;
  /** Their position, e.g. "Barangay Kagawad" or "Councilor". */
  role: string;
  /** Office address (card variant only). */
  office?: string;
  /** Phone text as published; each number becomes a `tel:` link. */
  phones?: readonly string[];
  emails?: readonly string[];
  /** A page for this person; the name links to it (external). */
  href?: string;
};

/**
 * A city official as an `OfficialList` card item, linking to their page on
 * the city's site. A councilor's position includes their council district.
 */
export function officialItem(o: CityOfficial): OfficialItem {
  return {
    name: o.name,
    role: o.district ? `${o.role} · ${BARANGAYS.district(o.district)}` : o.role,
    office: o.office,
    phones: o.phones,
    emails: o.emails,
    href: o.sourceUrl,
  };
}

const CONTACT_LINK = "type-ui inline-flex min-h-11 items-center text-ed-navy";

function Contacts({ item }: { item: OfficialItem }) {
  const phones = (item.phones ?? []).flatMap(parsePhones);
  const emails = item.emails ?? [];
  if (phones.length === 0 && emails.length === 0 && !item.office) return null;
  return (
    <dl className="m-0 mt-3 flex flex-col gap-1 border-t border-ed-rule pt-3">
      {item.office && (
        <div>
          <dt className="type-label text-ed-ink-3">{BARANGAYS.office}</dt>
          <dd className="type-ui m-0 text-ed-ink-2">{item.office}</dd>
        </div>
      )}
      {phones.length > 0 && (
        <div>
          <dt className="type-label text-ed-ink-3">{BARANGAYS.phone}</dt>
          <dd className="m-0 flex flex-wrap gap-x-4">
            {phones.map((p) =>
              p.href ? (
                <a key={p.text} href={p.href} className={CONTACT_LINK}>
                  {p.text}
                </a>
              ) : (
                <span
                  key={p.text}
                  className="type-ui inline-flex min-h-11 items-center text-ed-ink-2"
                >
                  {p.text}
                </span>
              ),
            )}
          </dd>
        </div>
      )}
      {emails.length > 0 && (
        <div>
          <dt className="type-label text-ed-ink-3">{BARANGAYS.email}</dt>
          <dd className="m-0 flex flex-wrap gap-x-4">
            {emails.map((e) => (
              <a key={e} href={mailto(e)} className={CONTACT_LINK}>
                {e}
              </a>
            ))}
          </dd>
        </div>
      )}
    </dl>
  );
}

/**
 * People and their positions. `plain` (default) is a ruled list, name on the
 * left and position on the right, for councils. `card` is a grid of square
 * cards that also show office, phone numbers (as `tel:` links) and emails
 * (as `mailto:` links), for officials residents may contact. `label` names
 * the list for screen readers. Server component.
 */
export function OfficialList({
  items,
  label,
  variant = "plain",
}: {
  items: readonly OfficialItem[];
  label: string;
  variant?: "plain" | "card";
}) {
  if (variant === "plain") {
    return (
      <ul
        aria-label={label}
        className="m-0 list-none border-t border-ed-rule p-0"
      >
        {items.map((item) => (
          <li
            key={`${item.role}-${item.name}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-ed-rule py-3"
          >
            <span className="type-body text-ed-ink">{item.name}</span>
            <span className="type-ui text-ed-ink-3">{item.role}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul
      aria-label={label}
      className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 p-0"
    >
      {items.map((item) => (
        <li
          key={`${item.role}-${item.name}`}
          className="border border-ed-rule bg-white p-5"
        >
          <p className="type-label m-0 text-ed-ink-3">{item.role}</p>
          <h3 className="type-subheading m-0 mt-1">
            {item.href ? (
              <a href={item.href} rel="noreferrer" className="text-ed-navy">
                {item.name}
              </a>
            ) : (
              item.name
            )}
          </h3>
          <Contacts item={item} />
        </li>
      ))}
    </ul>
  );
}
