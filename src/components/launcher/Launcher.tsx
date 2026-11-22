import type { Metadata } from "next";
import { getAppDirectory, links, type AppEntry } from "@/lib/apps";
import type { Locale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";
import { ExperimentDrawer } from "./ExperimentDrawer";
import { libraryRelease } from "./release";
import { InstallLibrary } from "./InstallLibrary";
import { LibraryUpdate } from "./LibraryUpdate";
import { Tile } from "./Tile";
import { notes } from "./notes";
import { ViewSwitch } from "@/components/site/ViewSwitch";
import styles from "./launcher.module.css";

const origin = "https://app.arybszleger.com";
const addresses = { en: origin + "/", pl: origin + "/pl" };
const words = {
  en: { title: "App Library", description: "Tibetan Buddhist texts for practice and study.", journal: "Journal", experiments: "Experiments" },
  pl: { title: "Biblioteka aplikacji", description: "Teksty buddyzmu tybetańskiego do praktyki i studiowania.", journal: "Dziennik", experiments: "Eksperymenty" },
};
const shortNames: Record<string, [string, string]> = {
  [links.mantras]: ["Mantras", "Mantry"],
  [links.yontenDzo]: ["Yönten Dzö", "Yönten Dzö"],
  [links.tibetanReading]: ["Tibetan Primer", "Elementarz tybetański"],
};
const iconByLink = new Map(Object.entries(links).map(([key, url]) => [String(url), key]));

export function launcherMetadata(locale: Locale): Metadata {
  const { title, description } = words[locale];
  return {
    title, description, applicationName: title,
    manifest: `/library-app/${locale}/manifest.webmanifest`,
    appleWebApp: { capable: true, title, statusBarStyle: "default" },
    icons: { icon: "/library-app/icon.svg", apple: "/library-app/icon-180.png" },
    alternates: { canonical: addresses[locale], languages: addresses },
    openGraph: { title, description, url: addresses[locale], images: [origin + "/library-app/gangtey.webp"] },
  };
}

export async function Launcher({ locale }: { locale: Locale }) {
  const { sections, experiments } = getAppDirectory(locale);
  const t = words[locale];
  const polish = locale === "pl";
  const website = "https://www.arybszleger.com" + (polish ? "/pl" : "");
  function tile({ href, title }: Pick<AppEntry, "href" | "title">, icon = iconByLink.get(href)) {
    return <Tile key={href} href={href} icon={icon!}
      label={shortNames[href]?.[polish ? 1 : 0] ?? title}
      description={notes[icon!][polish ? 1 : 0]} />;
  }
  return <ExperimentDrawer locale={locale} experiments={
    <section className={styles.experiments} aria-labelledby="experiment-title">
      <h2 id="experiment-title" tabIndex={-1}>{t.experiments}</h2>
      <div className={styles.grid}>{experiments.map(app => tile(app))}</div>
    </section>
  }>
    <div className={styles.inner} data-library-release={await libraryRelease()}>
      <header className={styles.top}>
        <a className={styles.author} href={website + "/"}><img src="/icon.svg" alt="" width="26" height="26" />{siteConfig.author}</a>
        <nav aria-label={polish ? "Język" : "Language"}>{(["en", "pl"] as const).map(lang =>
          <a key={lang} lang={lang} hrefLang={lang} aria-label={lang === "pl" ? "Polski" : "English"} aria-current={lang === locale ? "page" : undefined} href={addresses[lang]}>{lang.toUpperCase()}</a>
        )}</nav>
      </header>
      <div className={styles.hero}>
        <div><h1>{polish ? <>Biblioteka <em>aplikacji</em></> : <>App <em>Library</em></>}</h1>
        <p>{t.description}</p>
          <div className={styles.actions}><ViewSwitch locale={locale} app /><InstallLibrary locale={locale} /></div>
        </div>
      </div>
      <LibraryUpdate locale={locale} />
      <div className={styles.grid}>
        {sections.flatMap(section => section.apps.map(app => tile(app)))}
        {tile({ title: t.journal, href: website + "/blog" }, "journal")}
      </div>
    </div>
  </ExperimentDrawer>;
}
