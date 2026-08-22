import type { ReactNode } from "react";
import { slugify } from "@/lib/posts/slug";
import { siteConfig } from "@/lib/site-config";
import type { Locale } from "./config";

/**
 * Every string the public site renders, in both languages.
 *
 * The English entries quote `siteConfig` wherever the value is also used by
 * feeds, JSON-LD and the sitemap, so there is still exactly one source of
 * truth for the site's identity; the Polish entries are the translations
 * supplied by the author.
 */
export interface Dictionary {
  /** BCP 47 tag for `lang` attributes and `Intl` formatting. */
  htmlLang: string;
  /** Open Graph `og:locale`. */
  ogLocale: string;

  site: {
    title: string;
    description: string;
    /** Editorial eyebrow above the page title. */
    mark: string;
  };

  nav: {
    /** Accessible name of the corner navigation landmark. */
    label: string;
    home: string;
    journal: string;
    /** Accessible label on the flag that leads to this language. */
    switchTo: string;
  };

  home: {
    /** The four working languages, rendered with `·` separators. */
    languages: string[];
    bio: ReactNode;
    experiments: string;
    openApp: string;
    open: string;
    purchase: string;
  };

  footer: {
    publishedBy: string;
    home: string;
    journal: string;
  };

  journal: {
    title: ReactNode;
    /** Plain-text form of the title, for <title> and breadcrumbs. */
    name: string;
    description: string;
    categoryMark: string;
    tagMark: string;
    searchMark: string;
    searchPlaceholder: string;
    searchSubmit: string;
    searchFieldLabel: string;
    searchHeading: string;
    searchPrompt: string;
    searchAwaiting: string;
    searchNothing: string;
    all: string;
    draft: string;
    /** Accessible name of the older/newer navigation. */
    pagination: string;
    furtherReading: string;
    empty: string;
    emptyCategory: string;
    emptyTag: string;
    newer: string;
    older: string;
    minRead: (minutes: number) => string;
    /** "page 3" — appended to the journal title on paginated listings. */
    pageLabel: (page: number) => string;
    taggedTitle: (name: string) => string;
    pageOf: (page: number, total: number) => string;
    postsInCategory: (count: number) => string;
    postsWithTag: (count: number) => string;
    resultsFor: (count: number, query: string) => string;
    inCategory: (name: string) => string;
    taggedWith: (name: string) => string;
    searchTitle: (query: string) => string;
  };

  breadcrumb: {
    /** Accessible name of the breadcrumb landmark. */
    label: string;
    home: string;
  };

  notFound: {
    mark: string;
    title: ReactNode;
    intro: string;
    home: string;
    journal: string;
  };

  /** Display names for post categories, keyed by category slug. */
  categories: Record<string, string>;
}

const en: Dictionary = {
  htmlLang: "en",
  ogLocale: "en_US",
  site: {
    title: siteConfig.title,
    description: siteConfig.description,
    mark: "Tibetan Buddhist Translations",
  },

  nav: {
    label: "Site",
    home: "← Home",
    journal: "Journal →",
    switchTo: "English version",
  },

  home: {
    languages: ["English", "Polish", "Tibetan", "Dzongkha"],
    bio: (
      <>
        <strong>Andrzej R. Rybszleger</strong> has served as a translator of
        Tibetan Buddhist texts for over 20 years, working across liturgical
        texts, study aids, and commentaries — translating into English and
        Polish. His translations are published by Yeshe Khorlo under the
        direction of <strong>H.E. Gangteng Tulku Rinpoche</strong>. These apps
        are offered freely as a service to practitioners.
      </>
    ),
    experiments: "Experiments",
    openApp: "Open app →",
    open: "Open →",
    purchase: "Purchase",
  },

  footer: {
    publishedBy: "Translations published by",
    home: "Home",
    journal: siteConfig.blogTitle,
  },

  journal: {
    title: (
      <>
        The <em>Journal</em>
      </>
    ),
    name: siteConfig.blogTitle,
    description: siteConfig.blogDescription,
    categoryMark: `${siteConfig.blogTitle} · Category`,
    tagMark: `${siteConfig.blogTitle} · Tag`,
    searchMark: `${siteConfig.blogTitle} · Search`,
    searchPlaceholder: "Search the journal…",
    searchSubmit: "Search",
    searchFieldLabel: "Search posts",
    searchHeading: "Search",
    searchPrompt: "Type a word or phrase to search the journal.",
    searchAwaiting: "Awaiting your search.",
    searchNothing: "Nothing found — try a different phrase.",
    all: "All",
    draft: "Draft",
    pagination: "Pagination",
    furtherReading: "Further Reading",
    empty: "Nothing here yet — new notes are on their way.",
    emptyCategory: "No posts in this category yet.",
    emptyTag: "No posts with this tag yet.",
    newer: "← Newer",
    older: "Older →",
    minRead: (minutes) => `${minutes} min read`,
    pageLabel: (page) => `page ${page}`,
    taggedTitle: (name) => `Tagged “${name}”`,
    pageOf: (page, total) => `Page ${page} of ${total}`,
    postsInCategory: (count) =>
      `${count} ${count === 1 ? "post" : "posts"} in this category.`,
    postsWithTag: (count) =>
      `${count} ${count === 1 ? "post" : "posts"} with this tag.`,
    resultsFor: (count, query) =>
      `${count} ${count === 1 ? "result" : "results"} for “${query}”`,
    inCategory: (name) => `Journal posts in the ${name} category.`,
    taggedWith: (name) => `Journal posts tagged ${name}.`,
    searchTitle: (query) => `Search: ${query}`,
  },

  breadcrumb: {
    label: "Breadcrumb",
    home: "Home",
  },

  notFound: {
    mark: "Not Found",
    title: (
      <>
        Gone <em>elsewhere</em>
      </>
    ),
    intro:
      "The page you are looking for does not exist — like all conditioned things, it may simply have moved on.",
    home: "Return home",
    journal: "Browse the journal",
  },

  categories: {},
};

/**
 * Polish plural agreement: 1 wpis, 2–4 wpisy, 5+ wpisów (and 12–14 wpisów).
 * `Intl.PluralRules` knows the rule; the three forms are ours.
 */
const plPluralRules = new Intl.PluralRules("pl-PL");

function plForm(count: number, one: string, few: string, many: string): string {
  const category = plPluralRules.select(count);
  if (category === "one") return one;
  if (category === "few") return few;
  return many;
}

const pl: Dictionary = {
  htmlLang: "pl",
  ogLocale: "pl_PL",
  site: {
    title:
      "Andrzej R. Rybszleger — tybetańskie teksty buddyjskie w przekładzie",
    description:
      "Tłumaczenia tybetańskich tekstów buddyjskich na język angielski i polski — teksty liturgiczne, komentarze i materiały pomocnicze do nauki, publikowane przez Yeshe Khorlo pod kierunkiem J.E. Gangtenga Tulku Rinpocze i udostępniane bezpłatnie jako aplikacje dla praktykujących.",
    mark: "Tybetańskie teksty buddyjskie — tłumaczenia",
  },

  nav: {
    label: "Witryna",
    home: "← Strona główna",
    journal: "Wpisy →",
    switchTo: "Wersja polska",
  },

  home: {
    languages: ["Angielski", "Polski", "Tybetański", "Dzongkha"],
    bio: (
      <>
        <strong>Andrzej R. Rybszleger</strong> od ponad 20 lat tłumaczy
        tybetańskie teksty buddyjskie na język angielski i polski, w tym teksty
        liturgiczne, komentarze i materiały pomocnicze do nauki. Jego przekłady
        są publikowane przez Yeshe Khorlo pod kierunkiem{" "}
        <strong>J.E. Gangtenga Tulku Rinpocze</strong>. Wszystkie te aplikacje
        są udostępniane bezpłatnie jako wsparcie dla praktykujących.
      </>
    ),
    experiments: "Eksperymenty",
    openApp: "Otwórz aplikację →",
    open: "Otwórz →",
    purchase: "Kup",
  },

  footer: {
    publishedBy: "Tłumaczenia publikowane przez",
    home: "Strona główna",
    journal: "Wpisy",
  },

  journal: {
    title: <em>Wpisy</em>,
    name: "Wpisy",
    description:
      "Notatki o przekładzie tybetańskich tekstów buddyjskich — nowe tłumaczenia, materiały do nauki i refleksje nad warsztatem tłumacza.",
    categoryMark: "Wpisy · Kategoria",
    tagMark: "Wpisy · Tag",
    searchMark: "Wpisy · Szukaj",
    searchPlaceholder: "Przeszukaj wpisy…",
    searchSubmit: "Szukaj",
    searchFieldLabel: "Szukaj wśród wpisów",
    searchHeading: "Wyszukiwanie",
    searchPrompt: "Wpisz słowo lub frazę, aby przeszukać wpisy.",
    searchAwaiting: "Czekam na Twoje zapytanie.",
    searchNothing: "Nic nie znaleziono — spróbuj innej frazy.",
    all: "Wszystko",
    draft: "Szkic",
    pagination: "Paginacja",
    furtherReading: "Dalsza lektura",
    empty: "Nie ma tu jeszcze nic — nowe notatki są w drodze.",
    emptyCategory: "W tej kategorii nie ma jeszcze wpisów.",
    emptyTag: "Nie ma jeszcze wpisów z tym tagiem.",
    newer: "← Nowsze",
    older: "Starsze →",
    minRead: (minutes) => `${minutes} min czytania`,
    pageLabel: (page) => `strona ${page}`,
    taggedTitle: (name) => `Oznaczone tagiem „${name}”`,
    pageOf: (page, total) => `Strona ${page} z ${total}`,
    postsInCategory: (count) =>
      `${count} ${plForm(count, "wpis", "wpisy", "wpisów")} w tej kategorii.`,
    postsWithTag: (count) =>
      `${count} ${plForm(count, "wpis", "wpisy", "wpisów")} z tym tagiem.`,
    resultsFor: (count, query) =>
      `${count} ${plForm(count, "wynik", "wyniki", "wyników")} dla „${query}”`,
    inCategory: (name) => `Wpisy w kategorii ${name}.`,
    taggedWith: (name) => `Wpisy oznaczone tagiem ${name}.`,
    searchTitle: (query) => `Szukaj: ${query}`,
  },

  breadcrumb: {
    label: "Ścieżka nawigacji",
    home: "Strona główna",
  },

  notFound: {
    mark: "Nie znaleziono",
    title: (
      <>
        Odeszło <em>gdzie indziej</em>
      </>
    ),
    intro:
      "Strona, której szukasz, nie istnieje — jak wszystkie rzeczy uwarunkowane, mogła po prostu przeminąć.",
    home: "Wróć na stronę główną",
    journal: "Przeglądaj wpisy",
  },

  // Categories are authored in English in the post frontmatter; these are the
  // Polish display names, keyed by the slug the category resolves to.
  categories: {
    "translations-prayers-instructions": "Tłumaczenia, modlitwy, instrukcje",
    news: "Aktualności",
    translating: "O tłumaczeniu",
    phenomenology: "Fenomenologia",
    apps: "Aplikacje",
    craft: "Warsztat",
    prayers: "Modlitwy",
    sutra: "Sutra",
    sadhana: "Sadhana",
    "study-aid": "Materiały do nauki",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, pl };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/**
 * Display name for a post category. Falls back to the authored English name
 * whenever a category has no translation yet, so new categories still render.
 */
export function categoryName(name: string, locale: Locale): string {
  return getDictionary(locale).categories[slugify(name)] ?? name;
}
