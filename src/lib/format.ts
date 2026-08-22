import { defaultLocale, type Locale } from "@/lib/i18n/config";

/** Long-form date formatters matching the site's editorial tone, per locale. */
const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
  pl: new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
};

/** "3 July 2026" — or "3 lipca 2026" in Polish. */
export function formatDate(
  iso: string | null | undefined,
  locale: Locale = defaultLocale,
): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatters[locale].format(date);
}
