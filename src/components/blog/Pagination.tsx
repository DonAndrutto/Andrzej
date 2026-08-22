import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

/** Older/newer pagination. Page 1 lives at `basePath`, page N at `basePath/page/N`. */
export function Pagination({
  locale,
  basePath,
  page,
  totalPages,
}: {
  locale: Locale;
  basePath: string;
  page: number;
  totalPages: number;
}) {
  const t = getDictionary(locale);
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) =>
    localePath(p <= 1 ? basePath : `${basePath}/page/${p}`, locale);

  return (
    <nav className="pagination" aria-label={t.journal.pagination}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev">
          {t.journal.newer}
        </Link>
      ) : (
        <span className="disabled">{t.journal.newer}</span>
      )}
      <span>{t.journal.pageOf(page, totalPages)}</span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next">
          {t.journal.older}
        </Link>
      ) : (
        <span className="disabled">{t.journal.older}</span>
      )}
    </nav>
  );
}
