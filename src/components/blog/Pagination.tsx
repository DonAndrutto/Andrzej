import Link from "next/link";

/** Older/newer pagination. Page 1 lives at `basePath`, page N at `basePath/page/N`. */
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}/page/${p}`);

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev">
          ← Newer
        </Link>
      ) : (
        <span className="disabled">← Newer</span>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next">
          Older →
        </Link>
      ) : (
        <span className="disabled">Older →</span>
      )}
    </nav>
  );
}
