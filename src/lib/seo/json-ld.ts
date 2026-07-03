import type { Post } from "@/lib/posts/types";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

/**
 * Structured-data builders (schema.org JSON-LD). Each returns a plain object;
 * pages serialise them into a single <script type="application/ld+json">.
 */

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/blog/search?q={search_term_string}`,
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

export function blogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteConfig.url}/blog#blog`,
    name: `${siteConfig.author} — ${siteConfig.blogTitle}`,
    url: absoluteUrl("/blog"),
    description: siteConfig.blogDescription,
    inLanguage: siteConfig.locale,
    author: { "@id": `${siteConfig.url}/#person` },
  };
}

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    description: post.excerpt,
    url: absoluteUrl(`/blog/${post.slug}`),
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: siteConfig.locale,
    isPartOf: { "@id": `${siteConfig.url}/blog#blog` },
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
    articleSection: post.category,
    keywords: post.tags.join(", "),
    timeRequired: `PT${post.readingTimeMinutes}M`,
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path; omitted for the current (last) item. */
  path?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

/** Serialise one or more JSON-LD objects for a <script> tag. */
export function jsonLdScript(...objects: object[]): string {
  return JSON.stringify(objects.length === 1 ? objects[0] : objects);
}
