import Link from "next/link";
import type { Taxonomy } from "@/lib/posts/types";

/**
 * Search + category filter. The search form is a plain GET form to
 * /blog/search, so it works before (and without) JavaScript.
 */
export function JournalToolbar({
  categories,
  activeCategory,
  query,
}: {
  categories: Taxonomy[];
  activeCategory?: string;
  query?: string;
}) {
  return (
    <div className="journal-toolbar">
      <form className="search-form" action="/blog/search" role="search">
        <input
          type="search"
          name="q"
          placeholder="Search the journal…"
          defaultValue={query}
          aria-label="Search posts"
        />
        <button type="submit">Search</button>
      </form>
      {categories.length > 0 && (
        <ul className="chip-row">
          <li>
            <Link href="/blog" className={`chip${activeCategory ? "" : " chip-active"}`}>
              All
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/blog/category/${category.slug}`}
                className={`chip${activeCategory === category.slug ? " chip-active" : ""}`}
              >
                {category.name}
                <span className="chip-count">{category.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
