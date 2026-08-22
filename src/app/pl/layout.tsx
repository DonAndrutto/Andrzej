/**
 * The Polish edition of the site.
 *
 * The root layout owns <html lang="en"> for the default (English) edition,
 * so this subtree declares its own language on the element that wraps it —
 * enough for assistive technology, browser translation and search engines,
 * and it keeps every page statically rendered (reading the request in the
 * root layout would opt the whole site out of static generation).
 */
export default function PolishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div lang="pl">{children}</div>;
}
