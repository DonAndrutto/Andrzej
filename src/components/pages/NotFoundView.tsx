import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

export function NotFoundView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <header className="journal-header">
        <p className="dharma-mark">{t.notFound.mark}</p>
        <h1 className="journal-title">{t.notFound.title}</h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="journal-intro">{t.notFound.intro}</p>
      </header>
      <p className="empty-state">
        <Link href={localePath("/", locale)}>{t.notFound.home}</Link> ·{" "}
        <Link href={localePath("/blog", locale)}>{t.notFound.journal}</Link>
      </p>
      <SiteFooter locale={locale} />
    </>
  );
}
