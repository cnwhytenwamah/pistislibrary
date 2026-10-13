import Image from "next/image";

export function BookCover({
  title,
  coverUrl,
  className = "",
  priority = false,
}: {
  title: string;
  coverUrl: string | null;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-umber ${className}`}
    >
      {coverUrl ? (
        // Covers are signed or CDN URLs: serve them as-is (configure images.remotePatterns to optimize in production)
        <Image
          src={coverUrl}
          alt={`Cover of ${title}`}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 220px, 45vw"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-brown to-umber p-4 text-center"
        >
          <svg viewBox="0 0 24 24" className="size-8 text-copper-bright" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
            <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20" />
          </svg>
          <span className="line-clamp-4 text-xs font-medium text-ink-soft">{title}</span>
        </div>
      )}
    </div>
  );
}
