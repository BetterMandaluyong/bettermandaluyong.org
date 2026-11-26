// Layout ported from bettergovph/bettergov
// src/components/v2/home/BetterGovMovement.tsx at commit 5ead8c0 (MIT,
// Copyright (c) 2025-2026 BetterGov.ph contributors); see NOTICE.md. Changed:
// a light ed-paper-2 band (the navy original would merge into our navy
// footer), our copy from content.ts, no sunburst, no SectionHeader, a grid of
// volunteer roles in place of the community figures, our Button and Eyebrow,
// and links that open in the same tab.

import { useId } from "react";
import { Button } from "./Button.tsx";
import { Container } from "./Container.tsx";
import { Eyebrow } from "./Eyebrow.tsx";
import { VOLUNTEER } from "./content.ts";

/**
 * The volunteer call to action: a full-width `ed-paper-2` band with a navy
 * label, a display-face `<h2>`, a short paragraph, and two buttons (volunteer
 * with BetterGov.ph, join its Discord), beside a hairline grid of the kinds of
 * help wanted. Two columns on large screens, stacked below. Copy is
 * `VOLUNTEER` in `content.ts`. Rendered by `PageShell` above the footer on
 * every page; it takes no props.
 */
export function VolunteerBand() {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-ed-rule bg-ed-paper-2"
    >
      <Container className="grid grid-cols-1 items-start gap-8 py-10 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Eyebrow tone="navy">{VOLUNTEER.eyebrow}</Eyebrow>
          <h2
            id={headingId}
            className="m-0 mt-2 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em] text-ed-ink"
          >
            {VOLUNTEER.heading}
          </h2>
          <p className="type-lede m-0 mt-4 max-w-[65ch]">{VOLUNTEER.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href={VOLUNTEER.primary.href} rel="noreferrer">
              {VOLUNTEER.primary.label}
            </Button>
            <Button
              href={VOLUNTEER.secondary.href}
              rel="noreferrer"
              variant="ghost"
            >
              {VOLUNTEER.secondary.label}
            </Button>
          </div>
        </div>

        <dl
          aria-label={VOLUNTEER.rolesLabel}
          className="m-0 grid grid-cols-1 border-t border-l border-ed-rule sm:grid-cols-2"
        >
          {VOLUNTEER.roles.map((item) => (
            <div
              key={item.role}
              className="flex flex-col gap-1.5 border-r border-b border-ed-rule bg-white p-5"
            >
              <dt className="type-subheading">{item.role}</dt>
              <dd className="type-ui m-0 text-ed-ink-2">{item.description}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
