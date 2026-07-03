import type { Metadata } from "next";
import { Cormorant_Garamond, Josefin_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

/**
 * Typography is identical to the original static site (Cormorant Garamond +
 * Josefin Sans) but served through next/font: self-hosted, preloaded,
 * zero render-blocking requests and no layout shift from font swapping.
 */
const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const sans = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.author}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${siteConfig.author} — ${siteConfig.blogTitle}` },
      ],
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
