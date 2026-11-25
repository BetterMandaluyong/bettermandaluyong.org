import { Button } from "../components/Button.tsx";
import { Container } from "../components/Container.tsx";
import { PageShell } from "../components/PageShell.tsx";

// 404 — rendered for unknown URLs and for notFound(), inside the site frame.
export default function NotFound() {
  return (
    <PageShell>
      <Container narrow className="py-20">
        <h1 className="type-display m-0">Page not found</h1>
        <p className="type-lede m-0 mt-4">
          We couldn&apos;t find the page you were looking for.
        </p>
        <div className="mt-8">
          <Button href="/">Back to home</Button>
        </div>
      </Container>
    </PageShell>
  );
}
