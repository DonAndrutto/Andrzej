# arybszleger.com

Website of **Andrzej R. Rybszleger** — translator of Tibetan Buddhist texts
into English and Polish for over 20 years, working across liturgical texts,
study aids and commentaries under the direction of H.E. Gangteng Tulku
Rinpoche, published by Yeshe Khorlo. All apps are offered freely as a service
to practitioners.

The site is a Next.js (App Router) application: the original app directory as
the home page, plus a fully SEO-optimised journal (blog) with a built-in
content management system. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how
it fits together and how the Firebase/Vercel migration works.

The site is published in **English and Polish**. It always opens in English;
the flag in the top-right corner (beside *Journal* / *Wpisy*) switches to the
Polish edition, which lives under `/pl` — `/blog/some-post` ↔
`/pl/blog/some-post`, page for page. Translations are edited in
[`src/lib/i18n/dictionary.tsx`](./src/lib/i18n/dictionary.tsx) (site and
journal wording, including Polish category names) and
[`src/lib/apps.tsx`](./src/lib/apps.tsx) (the app cards). Journal posts
themselves are shown as written — only the frame around them is translated.

## Develop

```bash
npm install
npm run dev            # http://localhost:3000
```

To use the admin dashboard locally without Firebase, create `.env.local`:

```bash
ADMIN_DEV_PASSWORD=pick-a-long-random-string
```

then sign in at [`/admin`](http://localhost:3000/admin). Posts are saved to
`content/posts/*.md` and images to `public/uploads/` — commit them with git
to publish (a git-based CMS). With Firebase configured (see
[`.env.example`](./.env.example)) the same dashboard runs on Firestore,
Firebase Storage and Firebase Auth instead.

## Commands

| Command             | Purpose                       |
|---------------------|-------------------------------|
| `npm run dev`       | Development server            |
| `npm run build`     | Production build              |
| `npm start`         | Serve the production build    |
| `npm run typecheck` | TypeScript check              |

## Layout

```
content/posts/    journal posts (markdown + frontmatter)
public/uploads/   images uploaded through the CMS (local backend)
src/app/          routes: home, /blog, /pl (Polish), /admin, feeds, sitemap
src/components/   site, blog and admin components + pages/ (one view per
                  page, rendered by both language editions)
src/lib/          domain: posts, auth, storage, firebase, seo, i18n
index.html        legacy static home page — still served by GitHub Pages
```

`index.html`, `CNAME` and `docs/` keep the existing GitHub Pages deployment
alive; remove them once the domain points at Vercel.

## Contact

[translation@arybszleger.com](mailto:translation@arybszleger.com)
