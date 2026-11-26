# Brand voice

How Better Mandaluyong sounds. Read this before writing any copy that visitors
will see. This is a starting draft; the team will refine it as the site grows.

## Who we're talking to

Residents of Mandaluyong: people who walk its streets, ride its jeepneys, use
its parks, and want the city to work better for everyone. Many will read on a
phone, in a hurry.

## How we sound

- **Plain.** Short sentences, everyday words. "Sidewalks people can actually
  use", not "pedestrian infrastructure improvements".
- **Warm and inclusive.** "All of us", "everyone", "every barangay". The city
  belongs to its residents.
- **Hopeful, not angry.** Name what could be better and invite people in. No
  blame, no attacks on people or offices.
- **Specific.** Concrete things people can see: crossings, shade, clear
  information.

## Rules

- **Two names, two jobs.** The site is **BetterMandaluyong.org**: the header and
  footer wordmark, page titles, and link previews (`SITE.name`), written like
  BetterGov.ph. The community group behind it is **Better Mandaluyong**
  (`SITE.groupName`), used in sentences: "…, by Better Mandaluyong". The seal
  keeps the group's name.
- **Never invent facts.** No made-up people, quotes, numbers, events,
  partnerships, or endorsements. If a real fact isn't available yet, leave a
  clearly marked placeholder and say so in the PR.
- **Non-partisan.** Don't endorse or attack candidates, parties, or officials.
- **English first.** Filipino or Taglish is welcome where it reads more
  naturally to residents; keep each piece of copy consistent.
- **Copy lives in `components/content.ts`**, not inside page markup, so wording
  changes are one-line edits.
- **Section headings are in Title Case:** "City Officials", "Who Represents
  You", "News from the City Hall". Short words (a, and, for, from, of, on, the,
  to, …) stay lowercase unless they come first. Headlines, body text, buttons,
  and links stay in sentence case. `content_test.ts` checks the headings.
- **Calls to action are verbs:** "Get in touch", "Follow updates", "Join us".
