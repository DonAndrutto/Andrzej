import { localePath, type Locale } from "@/lib/i18n/config";
import styles from "./ViewSwitch.module.css";

const labels = {
  en: { navigation: "Site view", website: "Website", library: "App view" },
  pl: { navigation: "Widok strony", website: "Strona główna", library: "Widok aplikacji" },
};

export function ViewSwitch({ locale, app }: { locale: Locale; app: boolean }) {
  const text = labels[locale];
  const origin = app ? "https://www.arybszleger.com" : "https://app.arybszleger.com";

  return (
    <nav className={styles.switcher} aria-label={text.navigation}>
      <a href={origin + localePath("/", locale)}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
          {app ? (
            <><rect x="2" y="2.5" width="12" height="11" rx="1.3" /><path d="M2 6h12" /></>
          ) : (
            <path d="M2 2h4.5v4.5H2z M9.5 2H14v4.5H9.5z M2 9.5h4.5V14H2z M9.5 9.5H14V14H9.5z" />
          )}
        </svg>
        {app ? text.website : text.library}
      </a>
    </nav>
  );
}
