import type { Locale } from "@/lib/i18n/config";

/**
 * The small flag used by the language switch — deliberately quiet: a hairline
 * frame in the page's own ink colour so it reads as an ornament rather than
 * a button. Decorative by design; the accessible name lives on the link.
 */
export function LanguageFlag({ locale }: { locale: Locale }) {
  return locale === "pl" ? <PolishFlag /> : <BritishFlag />;
}

const frame = (
  <rect
    x="0.3"
    y="0.3"
    width="17.4"
    height="11.4"
    rx="1.3"
    fill="none"
    stroke="currentColor"
    strokeOpacity="0.35"
    strokeWidth="0.6"
  />
);

function PolishFlag() {
  return (
    <svg
      viewBox="0 0 18 12"
      width="18"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id="flag-clip-pl">
        <rect width="18" height="12" rx="1.5" />
      </clipPath>
      <g clipPath="url(#flag-clip-pl)">
        <rect width="18" height="6" fill="#ffffff" />
        <rect y="6" width="18" height="6" fill="#d4213d" />
      </g>
      {frame}
    </svg>
  );
}

function BritishFlag() {
  return (
    <svg
      viewBox="0 0 18 12"
      width="18"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id="flag-clip-en">
        <rect width="18" height="12" rx="1.5" />
      </clipPath>
      <g clipPath="url(#flag-clip-en)">
        <rect width="18" height="12" fill="#012169" />
        <path d="M0 0 18 12M18 0 0 12" stroke="#ffffff" strokeWidth="2.6" />
        <path d="M0 0 18 12M18 0 0 12" stroke="#c8102e" strokeWidth="1.3" />
        <path d="M9 0V12M0 6H18" stroke="#ffffff" strokeWidth="4" />
        <path d="M9 0V12M0 6H18" stroke="#c8102e" strokeWidth="2.4" />
      </g>
      {frame}
    </svg>
  );
}
