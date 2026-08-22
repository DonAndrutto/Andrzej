import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} {siteConfig.author} &nbsp;·&nbsp;{" "}
        {t.footer.publishedBy} <strong>{siteConfig.publisher}</strong>{" "}
        &nbsp;·&nbsp; <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
      </p>
      <p className="footer-nav">
        <Link href={localePath("/", locale)}>{t.footer.home}</Link>
        <Link href={localePath("/blog", locale)}>{t.footer.journal}</Link>
        <Link href="/feed.xml">RSS</Link>
      </p>
    </footer>
  );
}
