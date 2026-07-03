/**
 * Central site configuration.
 *
 * Single source of truth for identity, canonical URLs and listing behaviour —
 * referenced by metadata, JSON-LD, the sitemap, the RSS feed and the UI.
 */
export const siteConfig = {
  /** Site owner / author. */
  author: "Andrzej R. Rybszleger",
  /** Short site name (used by Open Graph `site_name`, JSON-LD, RSS). */
  name: "Andrzej R. Rybszleger — Tibetan Buddhist Translations",
  /** Default <title> for the home page. */
  title: "Andrzej R. Rybszleger — Tibetan Buddhist Translations",
  description:
    "Translations of Tibetan Buddhist texts into English and Polish by Andrzej R. Rybszleger — liturgical texts, study aids and commentaries published by Yeshe Khorlo under the direction of H.E. Gangteng Tulku Rinpoche, offered freely as apps for practitioners.",
  /** Canonical origin, no trailing slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://arybszleger.com").replace(
    /\/+$/,
    "",
  ),
  email: "translation@arybszleger.com",
  publisher: "Yeshe Khorlo",
  locale: "en",
  /** Blog section title, used in headings, breadcrumbs and feeds. */
  blogTitle: "Journal",
  blogDescription:
    "Notes on translating Tibetan Buddhist texts — new translations, study aids and reflections on the craft.",
  postsPerPage: 9,
  relatedPostsCount: 3,
} as const;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
