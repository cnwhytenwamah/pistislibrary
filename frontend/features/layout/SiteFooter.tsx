import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-sm font-semibold tracking-[0.28em]">
            PISTIS<span className="text-copper-bright">LIBRARY</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">{siteConfig.tagline}</p>
          <p className="mt-3 max-w-md text-xs text-ink-soft">
            PistisLibrary only shares books it has the right to distribute: public-domain works, openly
            licensed books, and books shared with the permission of their authors or publishers.
          </p>
        </div>
        <nav aria-label="Library">
          <h2 className="text-sm font-semibold">Library</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/books" className="hover:text-ink">All books</Link></li>
            <li><Link href="/categories" className="hover:text-ink">Categories</Link></li>
            <li><Link href="/authors" className="hover:text-ink">Authors</Link></li>
          </ul>
        </nav>
        <nav aria-label="Community">
          <h2 className="text-sm font-semibold">Can&apos;t find a book?</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/requests/new" className="hover:text-ink">Request a book</Link></li>
            <li><Link href="/login" className="hover:text-ink">Log in</Link></li>
            <li><Link href="/register" className="hover:text-ink">Create an account</Link></li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
