import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { defaultLocale, localePath, locales, type Locale } from "./config";
import { getDictionary } from "./dictionary";

/**
 * Canonical URL plus `hreflang` alternates for a page that exists in both
 * languages. Paths are written in their unprefixed English form; every
 * language edition of the page then points at all the others, which is what
 * stops the two editions competing with each other in search results.
 */
export function localeAlternates(
  path: string,
  locale: Locale,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {
    "x-default": localePath(path, defaultLocale),
  };
  for (const candidate of locales) {
    languages[getDictionary(candidate).htmlLang] = localePath(path, candidate);
  }
  return { canonical: localePath(path, locale), languages };
}

/**
 * Open Graph fields shared by every page of a language edition. Next.js
 * replaces `openGraph` wholesale rather than merging it with the layout's,
 * so the site name travels with these.
 */
export function localeOpenGraph(path: string, locale: Locale) {
  return {
    siteName: siteConfig.name,
    locale: getDictionary(locale).ogLocale,
    url: localePath(path, locale),
  };
}
