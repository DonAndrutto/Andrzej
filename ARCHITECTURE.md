# Architecture

This repository began as a single static `index.html` served by GitHub Pages.
It is now a **Next.js (App Router)** application designed for **Vercel**
deployment with a **Firebase** backend (Authentication, Firestore, Storage) —
while remaining fully functional today with zero external services.

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js App Router (src/app)                                   │
│                                                                 │
│  Public (static / ISR)          Admin (dynamic, session-gated)  │
│  /            home (EN)        /admin           dashboard      │
│  /blog …      journal          /admin/posts …   CMS editor     │
│  /pl, /pl/… same, in Polish    /admin/preview   draft preview  │
│  /feed.xml    RSS              /api/admin/*     mutations      │
│  /sitemap.xml /robots.txt      /api/auth/session sessions      │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
        PostRepository            ImageStorage · AdminSession
        (src/lib/posts)           (src/lib/storage · src/lib/auth)
                │                         │
   ┌────────────┴───────────┐   ┌─────────┴──────────┐
   │ FsPostRepository       │   │ LocalImageStorage  │  no config
   │  content/posts/*.md    │   │  public/uploads/   │  needed
   ├────────────────────────┤   ├────────────────────┤
   │ FirestorePostRepository│   │ FirebaseImage-     │  env vars
   │  Firestore `posts`     │   │  Storage (bucket)  │  present
   └────────────────────────┘   └────────────────────┘
```

## The one idea that matters: swappable backends

Nothing outside `src/lib` touches a database, the filesystem or Firebase.
Pages, feeds and API routes speak to three small interfaces:

| Interface        | Zero-config adapter                  | Firebase adapter                    | Selected by |
|------------------|--------------------------------------|-------------------------------------|-------------|
| `PostRepository` | `content/posts/*.md` (frontmatter)   | Firestore collection `posts`        | `FIREBASE_SERVICE_ACCOUNT` present (override: `CONTENT_BACKEND`) |
| `ImageStorage`   | `public/uploads/` (committed to git) | Firebase Storage + download tokens  | same (override: `IMAGE_BACKEND`) |
| Admin session    | `ADMIN_DEV_PASSWORD` (HMAC cookie, dev only) | Firebase Auth → session cookie + `ADMIN_ALLOWED_EMAILS` allowlist | Firebase env presence |

Both content backends serialise **exactly the same document shape** (the
`Post` type in `src/lib/posts/types.ts`) and share one query engine
(`src/lib/posts/query.ts`) for filtering, search, ordering and pagination —
so they are behaviourally identical by construction, and migrating to
Firestore is a data copy plus environment variables, not a rewrite.

### Operating modes

1. **Today (no Firebase, local writing).** Run `npm run dev` with
   `ADMIN_DEV_PASSWORD` set; the CMS writes markdown to `content/posts/` and
   images to `public/uploads/`. Commit and push — a git-based CMS.
2. **Vercel without Firebase.** The same content ships read-only inside the
   deployment; the public site (blog, feeds, SEO) is fully functional. The
   admin dashboard states that writing requires Firestore.
3. **Vercel + Firebase (target).** Set the env vars from `.env.example`;
   the repository/storage/auth factories switch to Firestore, Firebase
   Storage and Firebase Auth at boot. Publishing revalidates the static
   pages instantly (`revalidatePath`).

## Localisation (English · Polish)

English is the default and keeps every URL it has always had; Polish is the
same site one segment deeper. Nothing sniffs `Accept-Language` — the page
always opens in English, and the flag in the top-right corner (next to
*Journal* / *Wpisy*) is the only way in and out of Polish. That choice is
what keeps every public page statically rendered: reading the request in the
root layout would opt the whole site out of static generation.

| English            | Polish                | Rendered by                       |
|--------------------|-----------------------|-----------------------------------|
| `/`                | `/pl`                 | `HomeView`                        |
| `/blog`            | `/pl/blog`            | `JournalIndexView`                |
| `/blog/[slug]`     | `/pl/blog/[slug]`     | `PostView`                        |
| `/blog/category/…` | `/pl/blog/category/…` | `CategoryView`                    |
| `/blog/tag/…`      | `/pl/blog/tag/…`      | `TagView`                         |
| `/blog/page/[n]`   | `/pl/blog/page/[n]`   | `JournalPageView`                 |
| `/blog/search`     | `/pl/blog/search`     | `SearchView`                      |

- **One implementation per page.** The views in `src/components/pages/` take
  a `Locale` and do the work; the route files under `src/app` only pick a
  locale and pass their params, so the two editions cannot drift apart.
- **Strings** live in `src/lib/i18n/dictionary.tsx` (one `Dictionary` per
  locale, typed so a missing translation is a build error), the app directory
  in `src/lib/apps.tsx` (both languages linking to one shared table of URLs),
  and `src/lib/i18n/config.ts` owns the path arithmetic (`localePath`).
- **Post bodies are served as written** — the journal's *chrome* is
  translated (titles, dates, reading time, categories, pagination), not the
  authored English text. Category display names are translated by slug in the
  dictionary; unknown categories fall back to the authored name.
- **Polish agreement** is real agreement: counts run through
  `Intl.PluralRules` (`1 wpis`, `3 wpisy`, `7 wpisów`) and dates through
  `pl-PL` (`4 maja 2026`).
- **SEO**: every page emits `canonical` plus `hreflang` alternates for both
  editions (`x-default` → English), `og:locale` per edition, JSON-LD with the
  right `inLanguage`/`url`, and the sitemap lists both with `xhtml:link`
  alternates.
- **Language attribute**: the root layout owns `<html lang="en">`; the Polish
  subtree declares `lang="pl"` on the element wrapping it
  (`src/app/pl/layout.tsx`). A per-edition `<html>` would mean two root
  layouts and moving every existing route into a group — the trade the
  wrapper avoids.

## Rendering & performance

- **Public pages are static or ISR** (`revalidate = 300`): the home page,
  blog listings, posts, category/tag pages, sitemap and RSS are prerendered;
  Firestore is consulted only when a page revalidates. Search
  (`/blog/search`) is the single request-time page, and works without
  JavaScript (plain GET form).
- **Admin never taxes the public site**: everything under `/admin` renders
  dynamically behind the session check, and the Firebase *client* SDK is
  imported dynamically only on the login page.
- **Typography** via `next/font` (Cormorant Garamond, Josefin Sans):
  self-hosted, preloaded, no render-blocking font CSS.
- **Images** via `next/image` (AVIF/WebP, responsive `sizes`, lazy loading);
  blur placeholders are tiny data-URIs computed in the author's browser at
  upload time — no native image libraries server-side. Intrinsic dimensions
  are sniffed server-side (`src/lib/storage/image-dimensions.ts`) so layout
  never shifts.
- **Route-level code splitting** falls out of the App Router; the shared
  first-load JS stays ≈100 kB and admin-only code never reaches readers.

## SEO

- `generateMetadata` on every public page: canonical URLs, Open Graph
  (article type with publish/modified times, section, tags), Twitter cards.
- JSON-LD (`src/lib/seo/json-ld.ts`): `WebSite` + `Person` (home),
  `Blog`, `BlogPosting` and `BreadcrumbList` (journal), including
  `timeRequired` from computed reading time.
- `sitemap.xml`, `robots.txt` (App Router metadata routes) and a full-content
  RSS 2.0 feed at `/feed.xml`, all revalidated with content.
- Drafts are invisible everywhere public (pages 404, feeds/sitemap/search
  exclude them); the admin previews them at `/admin/preview/[slug]` through
  the same `PostArticle` component that renders published posts.

## Security posture

- Admin sessions are httpOnly `__session` cookies — Firebase **session
  cookies** minted server-side from a fresh ID token, verified with the Admin
  SDK on every admin render and mutation.
- Authentication ≠ authorisation: `ADMIN_ALLOWED_EMAILS` is a hard allowlist;
  with it unset, nobody is an admin (fail closed).
- The dev password path is disabled in production builds unless explicitly
  forced, and never active when Firebase is configured.
- Firestore/Storage rules (`firestore.rules`, `storage.rules`) lock client
  access down entirely — only the server (Admin SDK) reads and writes.
- Author markdown is sanitised server-side (`sanitize-html`) before render;
  upload endpoints validate type and size and never trust client dimensions.

## GitHub Pages coexistence

The original `index.html` and `CNAME` remain untouched at the repository
root, so the current GitHub Pages deployment keeps serving until DNS moves
to Vercel. `.nojekyll` stops Pages from processing the new directories. The
Next.js home page (`src/app/page.tsx`) is a faithful port of `index.html` —
same markup, tokens, animations and content (now data-driven from
`src/lib/apps.tsx`; `index.html` has no Polish edition — the flag and `/pl`
exist only in the Next.js app). Once Vercel serves `arybszleger.com`, delete
`index.html`, `CNAME` and `docs/`.
