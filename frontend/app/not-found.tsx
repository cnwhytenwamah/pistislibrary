import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { SiteFooter } from "@/features/layout/SiteFooter";
import { SiteHeader } from "@/features/layout/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container className="py-24 text-center">
          <p className="text-sm tracking-widest text-copper-soft uppercase">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            The book or page you&apos;re looking for may have moved, or it may not be available.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/books">Browse the library</LinkButton>
            <LinkButton href="/requests/new" variant="secondary">
              Request a book
            </LinkButton>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
