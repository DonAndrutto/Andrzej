import { defaultLocale, localePath, type Locale } from "@/lib/i18n/config";
import { categoryName, getDictionary } from "@/lib/i18n/dictionary";
import type { Post } from "@/lib/posts/types";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

/**
 * Structured-data builders (schema.org JSON-LD). Each returns a plain object;
 * pages serialise them into a single <script type="application/ld+json">.
 *
 * Every builder takes the locale of the page emitting it, so the `url`,
 * `@id` and `inLanguage` values describe the language edition the reader is
 * actually on — the one thing search engines need to keep the two editions
 * apart rather than treating them as duplicates.
 */

/** Absolute URL of a site-relative path within a language edition. */
function localeUrl(path: string, locale: Locale): string {
  return absoluteUrl(localePath(path, locale));
}

export function websiteJsonLd(locale: Locale = defaultLocale) {
  const t = getDictionary(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: localeUrl("/", locale),
    description: t.site.description,
    inLanguage: t.htmlLang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${localeUrl("/blog/search", locale)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/#person`,
    name: siteConfig.author,
    url: siteConfig.url,
    email: `mailto:${siteConfig.email}`,
    jobTitle: "Translator of Tibetan Buddhist texts",
    knowsLanguage: ["en", "pl", "bo", "dz"],
    worksFor: { "@type": "Organization", name: siteConfig.publisher },
  };
}

/** `@id` of the Blog node for a language edition. */
function blogId(locale: Locale): string {
  return `${localeUrl("/blog", locale)}#blog`;
}

export function blogJsonLd(locale: Locale = defaultLocale) {
  const t = getDictionary(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": blogId(locale),
    name: `${siteConfig.author} — ${t.journal.name}`,
    url: localeUrl("/blog", locale),
    description: t.journal.description,
    inLanguage: t.htmlLang,
    author: { "@id": `${siteConfig.url}/#person` },
  };
}

export function articleJsonLd(post: Post, locale: Locale = defaultLocale) {
  const url = localeUrl(`/blog/${post.slug}`, locale);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: getDictionary(locale).htmlLang,
    isPartOf: { "@id": blogId(locale) },
    author: {
      "@type": "Person",
      "@id": `${siteConfig.url}/#person`,
      name: siteConfig.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.url,
    },
    ...(post.featuredImage
      ? {
          image: {
            "@type": "ImageObject",
            url: post.featuredImage.url.startsWith("http")
              ? post.featuredImage.url
              : absoluteUrl(post.featuredImage.url),
            ...(post.featuredImage.width
              ? { width: post.featuredImage.width }
              : {}),
            ...(post.featuredImage.height
              ? { height: post.featuredImage.height }
              : {}),
          },
        }
      : {}),
    articleSection: categoryName(post.category, locale),
    keywords: post.tags.join(", "),
    timeRequired: `PT${post.readingTimeMinutes}M`,
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, unprefixed English form; omitted for the current item. */
  path?: string;
}

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  locale: Locale = defaultLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: localeUrl(item.path, locale) } : {}),
    })),
  };
}

/** Serialise one or more JSON-LD objects for a <script> tag. */
export function jsonLdScript(...objects: object[]): string {
  return JSON.stringify(objects.length === 1 ? objects[0] : objects);
}
