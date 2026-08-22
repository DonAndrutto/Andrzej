import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";

/** Visible breadcrumb trail; the matching BreadcrumbList JSON-LD is emitted by the page. */
export function Breadcrumbs({
  items,
  locale,
}: {
  items: BreadcrumbItem[];
  locale: Locale;
}) {
  const t = getDictionary(locale);
  return (
    <nav className="breadcrumbs" aria-label={t.breadcrumb.label}>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {index > 0 && (
              <span className="crumb-sep" aria-hidden="true">
                ·
              </span>
            )}
            {item.path ? (
              <Link href={localePath(item.path, locale)}>{item.name}</Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
