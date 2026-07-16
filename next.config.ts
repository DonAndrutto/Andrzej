import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The filesystem content backend reads content/posts at request time when
  // pages revalidate (ISR); make sure those files ship inside the serverless
  // function bundles on Vercel, not just the build environment.
  outputFileTracingIncludes: {
    "/**": ["./content/posts/**/*"],
  },
  images: {
    // Serve images directly instead of through Vercel's Image Optimization.
    // On the Vercel Hobby plan the optimizer is quota-limited and, once the
    // allowance is spent, every /_next/image request 402s
    // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) — which renders every
    // next/image (card thumbnails, featured images) as a broken image while
    // plain <img> body images keep working. Bypassing the optimizer makes
    // <Image> emit the original source URL, so images load straight from
    // Firebase Storage (long-cached, CDN-served) with no optimizer in the
    // path. Blur placeholders, sizing and layout are unaffected.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Firebase Storage download URLs (used once Firebase is configured).
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
