# SEO essentials for the public login page

## Overview

The app has almost no public surface: every route except the root (`/`,
`SessionsController#new`, a pure login form) sits behind Devise auth or
ActiveAdmin's own auth. There is no marketing/landing content anywhere. A
separate marketing site (outside this repo) already covers broader
SEO/AI-crawler discovery (`llms.txt` etc.), so this work is scoped to doing
basic technical SEO correctly for what exists today in this app: a
`robots.txt` that stops crawlers wasting time on gated screens, a sitemap
listing the one indexable URL, and real meta/Open Graph tags plus a social
preview image on the login page.

Production domain: `https://app.franpadelproject.com`.

## Goals

- `public/robots.txt` disallows the gated route prefixes and points crawlers
  at the sitemap.
- `public/sitemap.xml` lists the single public URL (`/`).
- The login page (`app/frontend/pages/Auth/Login.tsx`) serves a real
  `<title>`, meta description, canonical link, Open Graph tags, and a Twitter
  card, all present in the initial server-rendered HTML (not just after JS
  hydration).
- A 1200×630 `public/og-image.png` social preview image, generated from the
  existing `fran-methodology-logo.png` mark.
- Copy is Portuguese-only, matching the app's PT-first anonymous experience
  (locale switching is only available to logged-in users).

## Non-goals

- Any new marketing/landing page — out of scope, root stays the login form.
- `llms.txt` — the separate marketing site already owns this.
- JSON-LD structured data — not requested; nothing here has structured
  content (pricing, courses-as-products, etc.) worth marking up yet.
- A dynamic/generated sitemap (e.g. `sitemap_generator` gem) — overkill for
  exactly one URL. If more public pages appear later, revisit.
- hreflang alternates / bilingual meta tags — anonymous visitors only ever
  see the PT experience, so a single language is enough.
- Any change to gated pages (no `noindex` meta, no per-page SEO) — they're
  already excluded from crawling via `robots.txt`, and Google can't render
  content behind a login wall anyway.

## Components

### `public/robots.txt` (already exists, currently empty boilerplate)

```
User-agent: *
Disallow: /dashboard
Disallow: /admin
Disallow: /users

Sitemap: https://app.franpadelproject.com/sitemap.xml
```

Static file, served directly by Rails' default `public/` handling — no
controller or route needed.

### `public/sitemap.xml` (new)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://app.franpadelproject.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Static file, same reasoning as `robots.txt`.

### Meta tags on the login page

`app/frontend/pages/Auth/Login.tsx` currently renders no `<Head>` at all;
the document `<title>` comes from the static default in
`app/views/layouts/application.html.erb`. The app already has Inertia SSR
wired up (`inertia_ssr_head` in the layout), so an Inertia `<Head>` block
placed in the page component renders server-side into the initial HTML —
crawlers that don't execute JS still see it, and it also updates correctly
if a user navigates back to `/` client-side.

Add, using `@inertiajs/react`'s `<Head>`:

```tsx
<Head>
  <title>Fran Padel Academy — Curso de Padel Online</title>
  <meta
    name="description"
    content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado."
  />
  <link rel="canonical" href="https://app.franpadelproject.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Fran Padel Academy" />
  <meta
    property="og:description"
    content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado."
  />
  <meta property="og:url" content="https://app.franpadelproject.com/" />
  <meta property="og:image" content="https://app.franpadelproject.com/og-image.png" />
  <meta property="og:locale" content="pt_PT" />
  <meta name="twitter:card" content="summary_large_image" />
</Head>
```

Exact copy is a draft; the user may edit wording before/after implementation.

### OG image — `public/og-image.png`

1200×630 PNG: `fran-methodology-logo.png` centered on the app's `--color-ink`
(`#12283f`) background, matching the login page's dark aesthetic.

Constraint: this machine has no ImageMagick/libvips binaries installed, so
`mini_magick`/`image_processing` (already in the Gemfile, used for Active
Storage variants) can't be used to composite the image — both gems are
Ruby wrappers that shell out to those binaries. Generation approach instead:
build a small local HTML file sized exactly 1200×630 with the logo centered
on the ink background, open it via the Chrome browser tool, and screenshot
it at that size to produce the PNG. This is a one-off asset-generation step
(not a build-time process) — the resulting file is committed to `public/`
like any other static asset.

## Testing

- `spec/requests/seo_spec.rb`:
  - `GET /robots.txt` returns the disallow rules for `/dashboard`, `/admin`,
    `/users` and the `Sitemap:` line pointing at
    `https://app.franpadelproject.com/sitemap.xml`.
  - `GET /sitemap.xml` returns valid XML containing exactly one `<url>` with
    `<loc>https://app.franpadelproject.com/</loc>`.
  - `GET /` (login page) response body includes the meta description,
    canonical link, and `og:image` tags — verifying they're present in the
    server-rendered HTML, not only reachable after JS runs.
