import { cx } from "./cx.ts";

/** Someone listed in an `OrgNode`. */
export type OrgPerson = {
  name: string;
  /** Shown after the name, e.g. "Presiding officer". */
  role?: string;
  /** Their `/people/<slug>` page. */
  href?: string;
};

/**
 * One box in an `OrgChart`. A node with `people` is an office (its title is a
 * small label above the names); a node without is a group (its title is a
 * heading). `children` hang below it.
 */
export type OrgNode = {
  /** The office or group, e.g. "Mayor", "District 1 Councilors". */
  title: string;
  /** Links the title, e.g. to a barangay's page. */
  href?: string;
  /** One line under the title, e.g. "13 barangays". */
  meta?: string;
  people?: readonly OrgPerson[];
  children?: readonly OrgNode[];
  /**
   * Lay the children out as a grid of compact boxes with no connecting
   * lines: for many leaves of the same kind, like a district's barangays.
   */
  grid?: boolean;
};

// Phone and tablet: an indented tree. Each item draws its own piece of the
// vertical line (the first reaches up to the parent's box, the last stops at
// its tick) and a tick to its box.
const TREE_LIST = "m-0 mt-3 ml-4 flex list-none flex-col gap-3 p-0";
const TREE_ITEM = cx(
  "relative pl-5",
  "before:absolute before:top-0 before:-bottom-3 before:left-0 before:border-l first:before:-top-3",
  "last:before:bottom-auto last:before:h-6 first:last:before:h-9",
  "after:absolute after:top-6 after:left-0 after:w-4 after:border-t",
  "before:border-ed-rule-strong after:border-ed-rule-strong",
);

// Desktop: the top level becomes columns under a shared bar. Each column
// draws its part of the bar (the first and last start and stop at their
// centre) and a stub down to its box.
const TOP_LIST = cx(
  TREE_LIST,
  "lg:mt-0 lg:ml-0 lg:grid lg:grid-cols-[1fr_1fr_2fr] lg:gap-0",
);
const TOP_ITEM = cx(
  TREE_ITEM,
  "lg:px-3 lg:pt-6 lg:first:pl-0 lg:last:pr-0",
  "lg:before:top-0 lg:first:before:top-0 lg:first:last:before:h-0 lg:before:right-0 lg:before:bottom-auto lg:before:left-0 lg:before:h-0 lg:before:border-t lg:before:border-l-0",
  "lg:first:before:left-1/2 lg:last:before:right-1/2 lg:last:before:h-0",
  "lg:after:top-0 lg:after:left-1/2 lg:after:h-6 lg:after:w-0 lg:after:border-t-0 lg:after:border-l",
);

// A linked title (a place, like a barangay) reads as a heading; an office's
// unlinked title is a small label above the names.
function Title({ node, label }: { node: OrgNode; label?: boolean }) {
  if (node.href) {
    return (
      <p className="type-subheading m-0">
        <a
          href={node.href}
          className="text-ed-navy no-underline hover:underline"
        >
          {node.title}
        </a>
      </p>
    );
  }
  return (
    <p
      className={cx(
        "m-0",
        label ? "type-label text-ed-ink-3" : "type-subheading",
      )}
    >
      {node.title}
    </p>
  );
}

function Box({ node, root }: { node: OrgNode; root?: boolean }) {
  const office = node.people !== undefined;
  return (
    <div
      className={cx(
        "border px-4 py-3",
        root
          ? "border-ed-ink bg-white"
          : office
            ? "border-ed-rule bg-white"
            : "border-ed-rule-strong bg-ed-paper-2",
      )}
    >
      <Title node={node} label={office} />
      {node.meta && (
        <p className="type-ui m-0 mt-0.5 text-ed-ink-3">{node.meta}</p>
      )}
      {node.people && node.people.length > 0 && (
        <ul className="m-0 mt-1 list-none p-0">
          {node.people.map((p) => (
            <li key={`${p.name}-${p.role ?? ""}`} className="type-ui">
              {p.href ? (
                <a
                  href={p.href}
                  className="inline-block py-1 text-ed-navy no-underline hover:underline"
                >
                  {p.name}
                </a>
              ) : (
                <span className="inline-block py-1 text-ed-ink">{p.name}</span>
              )}
              {p.role && (
                <span className="-mt-1 block pb-1 text-ed-ink-3">{p.role}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Children({ node }: { node: OrgNode }) {
  const children = node.children ?? [];
  if (children.length === 0) return null;
  if (node.grid) {
    return (
      <ul className="m-0 mt-3 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2 p-0">
        {children.map((c) => (
          <li key={c.title} className="flex flex-col [&>div]:h-full">
            <Box node={c} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={TREE_LIST}>
      {children.map((c) => (
        <li key={c.title} className={TREE_ITEM}>
          <Box node={c} />
          <Children node={c} />
        </li>
      ))}
    </ul>
  );
}

/**
 * An org chart drawn with hairline connectors and no JavaScript: `root` at
 * the top, its children as columns under a shared bar on wide screens (an
 * indented tree on phones), and every deeper level as an indented tree.
 * A node with `grid` shows its children as a grid of compact boxes. The
 * structure is nested lists, so screen readers announce the levels. `label`
 * names the chart. Server component.
 */
export function OrgChart({ root, label }: { root: OrgNode; label: string }) {
  const branches = root.children ?? [];
  return (
    <figure aria-label={label} className="m-0">
      <div className="lg:mx-auto lg:w-fit lg:text-center">
        <Box node={root} root />
      </div>
      {branches.length > 0 && (
        <>
          <div
            aria-hidden
            className="mx-auto hidden h-6 w-0 border-l border-ed-rule-strong lg:block"
          />
          <ul className={TOP_LIST}>
            {branches.map((b) => (
              <li key={b.title} className={TOP_ITEM}>
                <Box node={b} />
                <Children node={b} />
              </li>
            ))}
          </ul>
        </>
      )}
    </figure>
  );
}
