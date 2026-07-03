import { CornerNav } from "@/components/site/CornerNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <CornerNav current="journal" />
      {children}
      <SiteFooter />
    </>
  );
}
