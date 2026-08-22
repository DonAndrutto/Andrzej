import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * The corner navigation is rendered by the pages themselves — it carries the
 * language switch, which needs to know the page it is switching away from.
 */
export default function PolishBlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter locale="pl" />
    </>
  );
}
