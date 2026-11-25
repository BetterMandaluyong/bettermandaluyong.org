import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE } from "../components/content.ts";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
  icons: { icon: { url: "/logo-seal.svg", type: "image/svg+xml" } },
  openGraph: { siteName: SITE.name, type: "website", url: SITE.url },
};

// Root shell: fonts and the skip link. Pages wrap their content in
// <PageShell> (components/PageShell.tsx).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ed-navy-2; a <meta> can't read CSS variables. */}
        <meta name="theme-color" content="#0a44bd" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-ed-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
