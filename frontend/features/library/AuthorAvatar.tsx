import Image from "next/image";

export function AuthorAvatar({
  name,
  photoUrl,
  size = 64,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return photoUrl ? (
    <Image
      src={photoUrl}
      alt={`Photo of ${name}`}
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-full border border-line object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-line bg-gradient-to-b from-brown to-umber font-semibold text-copper-soft"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {initials}
    </span>
  );
}
