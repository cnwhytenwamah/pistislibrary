import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Request a book", robots: { index: false } };

export default function RequestBookPage() {
  return (
    <Container className="max-w-2xl py-16">
      <EmptyState
        title="Book requests are opening soon"
        actions={<LinkButton href="/books">Browse the library</LinkButton>}
      >
        You&apos;ll soon be able to ask for a book here, and support requests from other readers. Everyone who
        asked is notified when it&apos;s added.
      </EmptyState>
    </Container>
  );
}
