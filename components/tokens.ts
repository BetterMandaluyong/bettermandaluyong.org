/**
 * The design tokens and type utilities, as data for the /storybook
 * specimens. Values live in app/globals.css (ported from the BetterGov.ph
 * v2 design system); this list names them with their roles from
 * bettergov.ph/design. tokens_test.ts checks every name exists in
 * globals.css, so a renamed or deleted token fails CI.
 */

/** A color token shown as a swatch. */
export type ColorToken = {
  /** Token name without the `--color-` prefix, e.g. `ed-ink`. */
  name: string;
  /** What it's for. */
  role: string;
  /** Fails WCAG AA as text: decorative use only. */
  decorativeOnly?: boolean;
};

/** Color tokens grouped as DESIGN.md lists them. */
export const COLOR_TOKENS: Record<string, ColorToken[]> = {
  Ink: [
    { name: "ed-ink", role: "Headings and primary text" },
    { name: "ed-ink-2", role: "Body copy" },
    { name: "ed-ink-3", role: "Secondary text and meta" },
    {
      name: "ed-ink-4",
      role: "Disabled states and decorative marks",
      decorativeOnly: true,
    },
  ],
  "Paper and rules": [
    { name: "ed-paper", role: "Page background" },
    { name: "ed-paper-2", role: "Tinted sections, mastheads" },
    { name: "ed-paper-3", role: "Deeper tint, wells" },
    { name: "ed-rule", role: "Default borders and dividers" },
    { name: "ed-rule-strong", role: "Emphasised borders" },
  ],
  Navy: [
    { name: "ed-navy", role: "Links, primary buttons, active states" },
    { name: "ed-navy-2", role: "Hero bands; navy hover" },
    { name: "ed-navy-ink", role: "Darkest navy: emphasis, hover surfaces" },
    { name: "ed-navy-tint", role: "Subtle navy background" },
  ],
  Accents: [
    { name: "ed-red", role: "Urgency only" },
    { name: "ed-red-ink", role: "Red text on light backgrounds" },
    { name: "ed-sage", role: "Sparing accent, never interactive" },
    {
      name: "ed-gold",
      role: "Sparing accent, never interactive or text",
      decorativeOnly: true,
    },
  ],
  Status: [
    { name: "success-700", role: "Success; safe under white text" },
    { name: "warning-500", role: "Warnings: dark text + an icon" },
    { name: "error-600", role: "Errors, destructive actions" },
  ],
};

/** Type scale utilities, largest first, with what each is for. */
export const TYPE_UTILITIES = [
  { name: "type-display", role: "Page title in a masthead. One per page." },
  { name: "type-section", role: "Section titles (SectionHeader)." },
  { name: "type-subheading", role: "Sub-sections and card titles." },
  { name: "type-lede", role: "Intro paragraph under a page title." },
  { name: "type-body", role: "Long-form reading." },
  { name: "type-ui", role: "Buttons, forms, navigation, dense lists." },
  { name: "type-label", role: "Eyebrows, tags, metadata. Never sentences." },
] as const;
