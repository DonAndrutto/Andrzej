/**
 * Locale routing.
 *
 * English is the default and keeps every URL it has always had (`/`,
 * `/blog/…`); Polish mirrors the same tree one segment deeper (`/pl`,
 * `/pl/blog/…`). Nothing sniffs `Accept-Language` — the site always opens in
 * English and the reader chooses Polish with the flag in the corner — which
 * also keeps every public page statically rendered.
 */

export const locales = ["en", "pl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** The language the flag in the corner switches to. */
export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "pl" : "en";
}

/** URL segment for a locale — empty for the default one. */
function localeSegment(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/**
 * Translate a site-relative path (always written in its English, unprefixed
 * form) into the given locale: `localePath("/blog", "pl") === "/pl/blog"`.
 */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const segment = localeSegment(locale);
  if (!segment) return clean;
  return clean === "/" ? segment : `${segment}${clean}`;
}
