# UI revamp + locale-routing migration

## Overview

Replace every screen and flow in the app except the login screen with the
approved new design (mockups **1A** mobile / **1D** desktop, implemented as a
reference Next.js app in `design/`). Content organization is being redesigned
separately (see `project_notion_content_sync` memory), so all module,
exercise, quiz, and progress content in the revamped screens is static
placeholder data for now — no Contentful or Supabase content reads.

Alongside the UI revamp, drop the `next-intl` URL-locale-prefix routing
(`/[locale]/...`) app-wide and run English-only. This removes friction the
UI revamp would otherwise inherit (a language toggle with nothing to switch
to) and simplifies auth/middleware in the process.

## Goals

- Replace the dashboard subtree's screens and flows with the new design,
  wired into the existing Next.js app (not a standalone app).
- Flatten routing: drop the `[locale]` URL segment everywhere.
- Keep the login screen's rendered output unchanged.
- Keep the existing Supabase-backed auth flow (login, invite, password
  reset, email confirm, OTP verify, callback) working exactly as it does
  today, just at unprefixed paths.

## Non-goals

- Wiring real content (modules/exercises/quiz/progress) — deferred until
  the content-org redesign lands.
- Redesigning any auth screen other than login.
- Reintroducing Portuguese — out of scope for this migration; if/when it
  returns it will likely ride on the new content pipeline rather than
  URL-prefix routing.
- Preserving old locale-prefixed URLs (`/en/...`, `/pt/...`) — they 404
  after this migration; no redirect shim.

## Route mapping

| Current | New | Change |
|---|---|---|
| `/[locale]` | `/` | Login screen, unchanged content. No more redirect-to-default-locale hop — this *is* the page now. |
| `/[locale]/auth/*` | `/auth/*` | Unchanged internals (callback, confirm, forgot-password, reset-password, invite, verify), moved up one directory. |
| `/[locale]/dashboard` | `/dashboard` | Replaced: new Dashboard home (progress card, continue-card, module list, week strip), static data. |
| `/[locale]/dashboard/beginner`, `/intermediate` | `/dashboard/courses`, `/dashboard/courses/[id]` | Replaced: one Courses page with a level strip (Beginner active, Intermediate/Advanced locked) instead of separate per-level dashboards. |
| `/[locale]/dashboard/certification` | — | Dropped. No equivalent level in the new design; deleted along with its page/components/data calls. |
| — | `/dashboard/courses/[id]/quiz` | New: knowledge check per module. |
| `/[locale]/dashboard/exercises` | `/dashboard/exercises`, `/dashboard/exercises/[ref]` | Replaced: library with Technical/Tactical filter, plus a detail page. |
| `/[locale]/dashboard/weekly-planning` | `/dashboard/plan` | Replaced: drag-and-drop (desktop) / tap-to-assign (mobile) planner. |
| `/[locale]/dashboard/profile` | `/dashboard/profile` | Replaced: profile fields + sign out. No language toggle (nothing to switch to). |

`middleware.ts` needs no path-matching changes beyond removing the locale
layer — its auth check (redirect to login if unauthenticated) is already
route-shape-agnostic.

## Locale/i18n removal

Full rip-out, not a hardcoded-single-locale shim:

- Delete `src/i18n/config.ts`, `src/i18n/routing.ts`, `src/i18n/request.ts`,
  `src/locales/en.json`, `src/locales/pt.json`.
- Delete `src/components/LanguageSwitcher.tsx` and
  `src/components/LocaleLink.tsx` (any remaining usages become plain
  `next/link`).
- `src/app/[locale]/layout.tsx` and `src/app/layout.tsx` merge into a single
  `src/app/layout.tsx`: real `<html>/<body>`, Geist fonts, `<Analytics />`.
  Drop `NextIntlClientProvider`/`getMessages`.
- `src/app/[locale]/page.tsx` content moves to `src/app/page.tsx` directly
  (today's `src/app/page.tsx` redirect-to-default-locale stub goes away).
- `src/app/[locale]/error/page.tsx` → `src/app/error/page.tsx`.
- `src/app/[locale]/auth/*` → `src/app/auth/*`, contents unchanged.
- `useTranslations`/`getTranslations` calls in `LoginForm.tsx`,
  `LoginPage.tsx`, `LoginPage.withPassword.tsx`, `templates/login.tsx` are
  replaced with the equivalent hardcoded English string — same rendered
  text, no visual change.
- `middleware.ts`: remove the `next-intl` middleware wrapping and all
  locale-extraction/redirect-loop-prevention logic. What remains is the
  Supabase-session check against a plain public-route list (`/`,
  `/auth/callback`, `/auth/confirm`, `/auth/reset-password`,
  `/auth/invite`, `/auth/forgot-password`, `/auth/verify`).
- Remove `next-intl` from `package.json` once nothing references it.
- No redirect handling for stale `/en/*` / `/pt/*` links. Note: the
  Supabase `emailRedirectTo` targets (`/auth/callback`, `/auth/verify`)
  already point at unprefixed paths today, so this migration actually
  removes an existing indirection (they were relying on middleware to
  302 them into `/en/auth/callback`) rather than introducing a new one.

## Styling scope

- Root layout keeps **Geist** as the global font, so login/auth stay
  visually untouched.
- The new design's typefaces (**Archivo** for UI, **IBM Plex Mono** for
  eyebrows/refs/metadata) and color tokens are scoped to the dashboard
  subtree only, via a new `src/app/dashboard/layout.tsx` that loads the
  fonts and wraps children in a container carrying the font CSS variables
  — they do not leak into the global `<html>/<body>`.
- New color tokens added to the `@theme` block in `src/app/globals.css`
  alongside (not replacing) the existing `--color-p-*` tokens: `ink`,
  `ink-soft`, `ink-mute`, `teal`, `teal-deep`, `paper`, `line`, `mist`,
  `muted`, `danger`. Values per `design/tailwind.config.ts`.
- Radii (10/14/18px) and border-only (no shadow) card styling carry over
  as Tailwind utility classes on the ported components, not new tokens.

## Data layer

- Port `design/lib/data.ts` into `src/lib/dashboard-data.ts` (or similar)
  largely verbatim: `Module`, `Exercise`, `QuizQuestion` types; `MODULES`,
  `EXERCISES`, `QUIZ`, `DAYS`, `SHORT_DAY`, `DEFAULT_PLAN`, `USER`,
  `COURSE_STATS` constants; `getModule`/`getExercise` helpers.
- Zero Supabase/Contentful reads inside the new dashboard route subtree.
  The `USER` record (name, email, level, club, member-since) is the static
  placeholder from `design/lib/data.ts`, not the authenticated user's real
  identity — deferred until the content-org redesign lands.
- Quiz answers, exercise filter, weekly-plan assignments, and any other
  interactive state stay `useState`-local, matching the reference app.

## Components & shell

- Port `design/components/shell.tsx` (`AppShell`, `Sidebar`, `BottomTabs`,
  `PageHeader`) and `design/components/ui.tsx` (`ProgressBar`,
  `StatusBadge`, `Topic`, `Eyebrow`, `MediaPlaceholder`, `ExerciseCard`,
  `CategoryFilter`) into `src/components/dashboard/`.
- Drop `LanguageToggle` and `PageHeader`'s `withLanguage` prop entirely —
  no locale left to switch.
- Delete the old dashboard-only components superseded by the above:
  `ModuleCard.tsx`, `ModuleDetail.tsx`, `DashboardHeader.tsx`,
  `DashboardSidebar.tsx`, `WeeklyPlanningCalendar.tsx`.
- The ported components already use plain `next/link` (the reference app
  has no locale awareness to begin with), so no link-wrapper changes are
  needed there.

## Auth touchpoint

The one place this revamp touches real backend logic: the profile page's
"Sign out" button (inert in the reference prototype) is wired to the
existing `signOut` server action, relocated to `src/app/auth/actions.ts`.

## Explicitly out of scope

- Auth screens beyond login (invite, forgot/reset password, confirm,
  verify, callback): untouched visually and behaviorally — only their file
  path moves as part of the locale flattening.
- Certification: dropped from the IA for now.
- Portuguese support: dropped for now.
- Real content wiring: everything ported stays on placeholder data.
