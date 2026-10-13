import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { BookGridSkeleton } from "@/components/ui/skeleton";
import { JsonLd } from "@/components/json-ld";
import { BrowseCategories, FeaturedBooks, RecentBooks, RequestCta } from "@/features/library/HomeSections";
import { SearchForm } from "@/features/layout/SearchForm";
import { siteConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteConfig.url}/books?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <section className="bg-aura border-b border-line">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <p className="rounded-full border border-line px-4 py-1 text-xs tracking-widest text-copper-soft uppercase">
            {siteConfig.tagline}
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Discover <span className="text-copper-bright">Christian</span> books
          </h1>
          <p className="max-w-xl text-balance text-base text-ink-soft sm:text-lg">
            Read. Learn. Grow in faith. A growing digital library of Christian books you can read online or
            download.
          </p>
          <div className="mt-2 w-full max-w-2xl">
            <SearchForm size="lg" idSuffix="hero" />
          </div>
          <LinkButton href="/books" variant="secondary" size="lg">
            Explore the library
          </LinkButton>
        </Container>
      </section>

      <Container>
        <Suspense fallback={<SectionFallback />}>
          <FeaturedBooks />
        </Suspense>
        <Suspense fallback={null}>
          <RecentBooks />
        </Suspense>
        <Suspense fallback={null}>
          <BrowseCategories />
        </Suspense>
        <RequestCta />
      </Container>
    </>
  );
}

function SectionFallback() {
  return (
    <div className="mt-16">
      <BookGridSkeleton count={5} />
    </div>
  );
}
