export const siteConfig = {
  name: "PistisLibrary",
  tagline: "Discover. Read. Grow.",
  description:
    "A digital library for Christian books. Discover, read and download books, and request the ones you can't find.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
