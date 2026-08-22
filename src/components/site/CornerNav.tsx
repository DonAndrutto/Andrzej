import Link from "next/link";
import { LanguageFlag } from "@/components/site/LanguageFlag";
import { localePath, otherLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Quiet top-right navigation: the app directory ↔ the journal, plus the flag
 * that switches language. The flag points at the *same* page in the other
 * language, which is why every caller passes its own path.
 */
export function CornerNav({
  current,
  locale,
  path,
}: {
  current: "home" | "journal";
  locale: Locale;
  /** This page's site-relative path, written in its unprefixed English form. */
  path: string;
}) {
  const t = getDictionary(locale);
  const target = otherLocale(locale);
  const targetDictionary = getDictionary(target);

  return (
    <nav className="corner-nav" aria-label={t.nav.label}>
      {current === "home" ? (
        <Link href={localePath("/blog", locale)}>{t.nav.journal}</Link>
      ) : (
        <Link href={localePath("/", locale)}>{t.nav.home}</Link>
      )}
      <Link
        className="lang-switch"
        href={localePath(path, target)}
        hrefLang={targetDictionary.htmlLang}
        lang={targetDictionary.htmlLang}
        title={targetDictionary.nav.switchTo}
        aria-label={targetDictionary.nav.switchTo}
      >
        <LanguageFlag locale={target} />
      </Link>
    </nav>
  );
}
