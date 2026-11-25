/** Joins class names, skipping falsy values: `cx("a", ok && "b")`. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
