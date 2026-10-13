import type { NextConfig } from "next";

// Where the Express API lives. The browser only ever talks to the Next.js origin;
// requests to /api/v1/* are proxied to the API, which keeps auth cookies first-party.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  async redirects() {
    // The blueprint's /search route is the library page with a query (?q=...)
    return [{ source: "/search", destination: "/books", permanent: false }];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_URL}/api/v1/:path*` }];
  },
};

export default nextConfig;
