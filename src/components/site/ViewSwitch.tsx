import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/config";
import styles from "./ViewSwitch.module.css";

export function ViewSwitch({ locale, app }: { locale: Locale; app: boolean }) {
  const pl = locale === "pl";
  const path = localePath("/", locale);
  return <nav className={styles.switcher} aria-label={pl ? "Widok strony" : "Site view"}>
    <a href={"https://www.arybszleger.com" + path} aria-current={!app ? "page" : undefined}>
      <i className={styles.list} aria-hidden="true" />{pl ? "Strona" : "Website"}
    </a>
    <a href={"https://app.arybszleger.com" + path} aria-current={app ? "page" : undefined}>
      <i className={styles.squares} aria-hidden="true" />{pl ? "Aplikacje" : "App view"}
    </a>
  </nav>;
}
