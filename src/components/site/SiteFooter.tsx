import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} {siteConfig.author} &nbsp;·&nbsp; Translations
        published by <strong>{siteConfig.publisher}</strong> &nbsp;·&nbsp;{" "}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
      </p>
      <p className="footer-nav">
        <Link href="/">Home</Link>
        <Link href="/blog">{siteConfig.blogTitle}</Link>
        <Link href="/feed.xml">RSS</Link>
      </p>
    </footer>
  );
}
