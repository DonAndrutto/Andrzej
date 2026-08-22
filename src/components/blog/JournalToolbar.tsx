import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import { categoryName, getDictionary } from "@/lib/i18n/dictionary";
import type { Taxonomy } from "@/lib/posts/types";

/**
 * Search + category filter. The search form is a plain GET form to
 * /blog/search (or /pl/blog/search), so it works before (and without)
 * JavaScript.
 */
export function JournalToolbar({
  locale,
  categories,
  activeCategory,
  query,
}: {
  locale: Locale;
  categories: Taxonomy[];
  activeCategory?: string;
  query?: string;
}) {
  const t = getDictionary(locale);
  return (
    <div className="journal-toolbar">
      <form
        className="search-form"
        action={localePath("/blog/search", locale)}
        role="search"
      >
        <input
          type="search"
          name="q"
          placeholder={t.journal.searchPlaceholder}
          defaultValue={query}
          aria-label={t.journal.searchFieldLabel}
        />
        <button type="submit">{t.journal.searchSubmit}</button>
      </form>
      {categories.length > 0 && (
        <ul className="chip-row">
          <li>
            <Link
              href={localePath("/blog", locale)}
              className={`chip${activeCategory ? "" : " chip-active"}`}
            >
              {t.journal.all}
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={localePath(`/blog/category/${category.slug}`, locale)}
                className={`chip${activeCategory === category.slug ? " chip-active" : ""}`}
              >
                {categoryName(category.name, locale)}
                <span className="chip-count">{category.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
