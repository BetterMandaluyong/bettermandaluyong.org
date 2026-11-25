import type { Metadata } from "next";
import { ArrowLink } from "../components/ArrowLink.tsx";
import { Button } from "../components/Button.tsx";
import { Container } from "../components/Container.tsx";
import { Flag } from "../components/Flag.tsx";
import { PageShell } from "../components/PageShell.tsx";
import { PillarList } from "../components/PillarList.tsx";
import { SectionHeader } from "../components/SectionHeader.tsx";
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
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <Flag variant="navy">{HOME.eyebrow}</Flag>
            <h1 className="type-display m-0 mt-5 text-balance">
              {HOME.headline}
            </h1>
            <p className="type-lede m-0 mt-6 max-w-[65ch] text-pretty">
              {HOME.lede}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Button href={mailto(SITE.contactEmail)}>
                {HOME.primaryCta}
              </Button>
              <ArrowLink href={SITE.followUrl} external>
                {HOME.secondaryCta}
              </ArrowLink>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 md:py-16">
          <SectionHeader label={HOME.pillarsLabel} />
          <PillarList pillars={HOME.pillars} label={HOME.pillarsLabel} />
        </Container>
      </section>
    </PageShell>
  );
}
