export function SearchForm({
  size = "md",
  defaultValue,
  idSuffix = "header",
  className = "",
}: {
  size?: "md" | "lg";
  defaultValue?: string;
  idSuffix?: string;
  className?: string;
}) {
  const id = `site-search-${idSuffix}`;
  const big = size === "lg";
  return (
    <form action="/books" method="get" role="search" className={`flex w-full items-center gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search Christian books
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search Christian books…"
        autoComplete="off"
        className={`min-w-0 flex-1 rounded-full border border-line bg-surface text-ink placeholder:text-ink-soft focus:border-copper focus:shadow-glow ${
          big ? "px-6 py-4 text-base" : "px-4 py-2 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-full bg-copper-bright font-medium text-night transition hover:bg-copper-soft hover:shadow-glow-strong ${
          big ? "px-7 py-4 text-base" : "px-4 py-2 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
