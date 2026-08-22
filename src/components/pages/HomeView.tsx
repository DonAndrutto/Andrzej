import { Fragment } from "react";
import type { Metadata } from "next";
import { CornerNav } from "@/components/site/CornerNav";
import { DharmaDivider } from "@/components/site/DharmaDivider";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getAppDirectory, type AppEntry } from "@/lib/apps";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localeAlternates, localeOpenGraph } from "@/lib/i18n/metadata";
import { jsonLdScript, personJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";

/** The app directory — the site's front page, in one language. */
export function homeMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    // `absolute` keeps the root layout's "%s — Andrzej R. Rybszleger"
    // template from doubling the author's name on the front page.
    title: { absolute: t.site.title },
    description: t.site.description,
    alternates: localeAlternates("/", locale),
    openGraph: {
      title: t.site.title,
      description: t.site.description,
      ...localeOpenGraph("/", locale),
    },
  };
}

function AppCard({
  app,
  labels,
}: {
  app: AppEntry;
  labels: { openApp: string; purchase: string };
}) {
  if (app.purchaseHref) {
    return (
      <div className="card card-static">
        <span className="card-tag">{app.tag}</span>
        <span className="card-title">{app.title}</span>
        <span className="card-desc">{app.description}</span>
        <div className="card-actions">
          <a
            href={app.href}
            target="_blank"
            rel="noopener"
            className="card-action-primary"
          >
            {labels.openApp}
          </a>
          <a
            href={app.purchaseHref}
            target="_blank"
            rel="noopener"
            className="card-action-secondary"
          >
            {labels.purchase}
          </a>
        </div>
      </div>
    );
  }
  return (
    <a className="card" href={app.href} target="_blank" rel="noopener">
      <span className="card-tag">{app.tag}</span>
      <span className="card-title">{app.title}</span>
      <span className="card-desc">{app.description}</span>
      <span className="card-arrow">{labels.openApp}</span>
    </a>
  );
}

export function HomeView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { sections, experiments } = getAppDirectory(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(websiteJsonLd(locale), personJsonLd()),
        }}
      />

      <CornerNav current="home" locale={locale} path="/" />

      <header className="site-header">
        <p className="dharma-mark">{t.site.mark}</p>
        <h1>
          Andrzej R. <em>Rybszleger</em>
        </h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="subtitle">
          {t.home.languages.map((language, index) => (
            <Fragment key={language}>
              {index > 0 && (
                <>
                  {" "}
                  <span className="sep">·</span>{" "}
                </>
              )}
              {language}
            </Fragment>
          ))}
        </p>
      </header>

      <p className="bio">{t.home.bio}</p>

      {sections.map((section) => (
        <section key={section.label} aria-label={section.label}>
          <DharmaDivider />
          <h2 className="section-label">{section.label}</h2>
          <div className="grid">
            {section.apps.map((app) => (
              <AppCard key={app.title} app={app} labels={t.home} />
            ))}
          </div>
        </section>
      ))}

      <div className="experiments-wrapper">
        <details>
          <summary className="experiments-toggle">
            <span className="exp-chevron" aria-hidden="true">▶</span>
            <span className="exp-label">{t.home.experiments}</span>
          </summary>
          <div className="experiments-grid">
            {experiments.map((app) => (
              <a
                key={app.title}
                className="exp-card"
                href={app.href}
                target="_blank"
                rel="noopener"
              >
                <span className="card-tag">{app.tag}</span>
                <span className="card-title">{app.title}</span>
                <span className="card-desc">{app.description}</span>
                <span className="card-arrow">{t.home.open}</span>
              </a>
            ))}
          </div>
        </details>
      </div>

      <SiteFooter locale={locale} />
    </>
  );
}
