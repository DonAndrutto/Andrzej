import type { Metadata } from "next";
import { CornerNav } from "@/components/site/CornerNav";
import { DharmaDivider } from "@/components/site/DharmaDivider";
import { SiteFooter } from "@/components/site/SiteFooter";
import { appSections, experiments, type AppEntry } from "@/lib/apps";
import { personJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
  },
};

function AppCard({ app }: { app: AppEntry }) {
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
            Open app →
          </a>
          <a
            href={app.purchaseHref}
            target="_blank"
            rel="noopener"
            className="card-action-secondary"
          >
            Purchase
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
      <span className="card-arrow">Open app →</span>
    </a>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([websiteJsonLd(), personJsonLd()]),
        }}
      />

      <CornerNav current="home" />

      <header className="site-header">
        <p className="dharma-mark">Tibetan Buddhist Translations</p>
        <h1>
          Andrzej R. <em>Rybszleger</em>
        </h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="subtitle">
          English <span className="sep">·</span> Polish{" "}
          <span className="sep">·</span> Tibetan <span className="sep">·</span>{" "}
          Dzongkha
        </p>
      </header>

      <p className="bio">
        <strong>Andrzej R. Rybszleger</strong> has served as a translator of
        Tibetan Buddhist texts for over 20 years, working across liturgical
        texts, study aids, and commentaries — translating into English and
        Polish. His translations are published by Yeshe Khorlo under the
        direction of <strong>H.E. Gangteng Tulku Rinpoche</strong>. These apps
        are offered freely as a service to practitioners.
      </p>

      {appSections.map((section) => (
        <section key={section.label} aria-label={section.label}>
          <DharmaDivider />
          <h2 className="section-label">{section.label}</h2>
          <div className="grid">
            {section.apps.map((app) => (
              <AppCard key={app.title} app={app} />
            ))}
          </div>
        </section>
      ))}

      <div className="experiments-wrapper">
        <details>
          <summary className="experiments-toggle">
            <span className="exp-chevron" aria-hidden="true">▶</span>
            <span className="exp-label">Experiments</span>
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
                <span className="card-arrow">Open →</span>
              </a>
            ))}
          </div>
        </details>
      </div>

      <SiteFooter />
    </>
  );
}
