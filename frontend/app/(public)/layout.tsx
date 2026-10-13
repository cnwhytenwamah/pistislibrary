import { SiteFooter } from "@/features/layout/SiteFooter";
import { SiteHeader } from "@/features/layout/SiteHeader";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
