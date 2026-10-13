"use client";

import { Container } from "@/components/ui/container";
import { LinkButton, buttonClasses } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        We couldn&apos;t load this page. This is usually temporary. Please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClasses("primary", "md")}>
          Try again
        </button>
        <LinkButton href="/" variant="secondary">
          Back to home
        </LinkButton>
      </div>
    </Container>
  );
}
