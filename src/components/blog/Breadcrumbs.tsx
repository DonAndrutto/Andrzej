import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";

/** Visible breadcrumb trail; the matching BreadcrumbList JSON-LD is emitted by the page. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {index > 0 && (
              <span className="crumb-sep" aria-hidden="true">
                ·
              </span>
            )}
            {item.path ? (
              <Link href={item.path}>{item.name}</Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
