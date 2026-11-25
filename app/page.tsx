import type { Metadata } from "next";
import { Button } from "../components/Button.tsx";
import { Eyebrow } from "../components/Eyebrow.tsx";
import { PageShell } from "../components/PageShell.tsx";
import { PillarList } from "../components/PillarList.tsx";
import { HOME, SITE, mailto } from "../components/content.ts";

export const metadata: Metadata = {
  title: HOME.metaTitle,
  description: HOME.metaDescription,
  openGraph: {
    title: SITE.name,
    description:
      "A community effort for a more livable Mandaluyong. Launching soon.",
  },
};

export default function HomePage() {
  return (
    <PageShell>
      <section className="flex max-w-[44rem] flex-1 flex-col justify-center">
        <Eyebrow live>{HOME.eyebrow}</Eyebrow>
        <h1 className="m-0 font-display text-[clamp(2.5rem,7vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
          {HOME.headline}
        </h1>
        <p className="mt-6 max-w-xl text-[1.1875rem] text-pretty text-muted">
          {HOME.lede}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Button href={mailto(SITE.contactEmail)}>{HOME.primaryCta}</Button>
          <Button href={SITE.followUrl} variant="link" rel="noopener">
            {HOME.secondaryCta}
          </Button>
        </div>
      </section>

      <PillarList pillars={HOME.pillars} label={HOME.pillarsLabel} />
    </PageShell>
  );
}
