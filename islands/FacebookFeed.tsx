"use client";

import { useState } from "react";
import { Button } from "../components/Button.tsx";
import { NEWS } from "../components/content.ts";

/**
 * The city Public Information Office's Facebook timeline, behind a tap.
 * Nothing from Facebook loads until the visitor presses "Show Facebook
 * posts", which then renders the page-plugin iframe (lazy, no script). The
 * plain "See all posts on Facebook" link is always visible. This is the
 * repo's first island: a client component, serializable props only.
 * `pageUrl` is the Facebook page's address.
 */
export function FacebookFeed({ pageUrl }: { pageUrl: string }) {
  const [shown, setShown] = useState(false);
  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=500&height=700&small_header=true&adapt_container_width=true&hide_cover=true`;
  return (
    <div className="flex flex-col items-start gap-4">
      {shown ? (
        <iframe
          title={NEWS.facebookHeading}
          src={src}
          loading="lazy"
          width="100%"
          height={700}
          className="w-full max-w-[500px] border border-ed-rule"
        />
      ) : (
        <div className="flex flex-col items-start gap-2">
          <Button variant="ghost" onClick={() => setShown(true)}>
            {NEWS.facebookShow}
          </Button>
          <p className="type-ui m-0 text-ed-ink-3">{NEWS.facebookNote}</p>
        </div>
      )}
      <a
        href={pageUrl}
        rel="noreferrer"
        className="type-ui inline-flex min-h-11 items-center text-ed-navy"
      >
        {NEWS.facebookLink}
      </a>
    </div>
  );
}
