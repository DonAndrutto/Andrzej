import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => [{ locale: "en" }, { locale: "pl" }];

export async function GET(_: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const name = locale === "pl" ? "Biblioteka aplikacji" : "App Library";
  const manifest: MetadataRoute.Manifest = {
    id: "/", scope: "/", start_url: locale === "pl" ? "/pl" : "/",
    name, short_name: name, lang: locale, display: "standalone",
    theme_color: "#f6f2e9", background_color: "#f6f2e9",
    icons: [
      { src: "/library-app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/library-app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/library-app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}
