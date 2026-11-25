import { Button } from "../components/Button.tsx";
import { PageShell } from "../components/PageShell.tsx";

// 404 — rendered for unknown URLs and for notFound(), inside the site frame.
export default function NotFound() {
  return (
    <PageShell>
      <section className="flex flex-1 flex-col justify-center">
        <h1 className="m-0 font-display text-5xl font-bold tracking-[-0.02em]">
          Page not found
        </h1>
        <p className="mt-4 text-muted">
          We couldn&apos;t find the page you were looking for.
        </p>
        <div className="mt-8">
          <Button href="/">Back to home</Button>
        </div>
      </section>
    </PageShell>
  );
}
