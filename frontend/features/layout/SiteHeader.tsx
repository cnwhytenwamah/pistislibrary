import Link from "next/link";
import { AuthMenu } from "@/features/auth/AuthMenu";
import { NavLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { SearchForm } from "./SearchForm";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/80 backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-[0.28em] text-ink">
          PISTIS<span className="text-copper-bright">LIBRARY</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <NavLinks />
        </nav>

        <div className="ml-auto hidden w-full max-w-xs lg:block">
          <SearchForm idSuffix="header" />
        </div>

        <div className="ml-auto hidden md:block lg:ml-0">
          <AuthMenu />
        </div>

        <div className="ml-auto md:hidden">
          <MobileNav>
            <div className="space-y-4">
              <SearchForm idSuffix="mobile" />
              <nav aria-label="Main (mobile)">
                <NavLinks orientation="vertical" />
              </nav>
              <AuthMenu stacked />
            </div>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
