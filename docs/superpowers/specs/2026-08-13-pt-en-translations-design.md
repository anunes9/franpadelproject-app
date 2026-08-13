# PT/EN UI translations

## Overview

Adds bilingual (Portuguese/English) support for the app's UI chrome — the
text that lives in React components today, not the database-backed course
content. The [courses-module
spec](2026-08-13-courses-module-design.md) explicitly deferred localization
("No localization infrastructure... a real i18n project"); this is that
project, scoped deliberately narrow: static strings only.

Given the app's small size (9 Inertia pages, no plurals/date-formatting
needs) and that everything renders client-side, this uses a lightweight
homegrown dictionary + hook instead of pulling in `react-i18next` or
threading translations through Rails' `I18n`/YAML. Portugal is the current
market, so Portuguese is the default for every new user and every guest.

## Goals

- Every hardcoded UI string in the 9 pages
  (`Auth/Login`, `Dashboard/Home`, `Courses/Index`, `Courses/Show`,
  `Courses/Quiz`, `Plan/Index`, `Profile/Show`, `Exercises/Index`,
  `Exercises/Show`) and shared components (`components/shell.tsx`'s nav/tabs/
  sign-out, status pills in `components/ui/*`) is sourced from typed PT/EN
  dictionaries instead of string literals.
- Users can switch language from the Profile page. The choice is saved to
  their account (`users.locale`) so it follows them across sessions/devices,
  and takes effect immediately.
- New users and unauthenticated visitors default to Portuguese.
- The Devise login-failure message is fully owned by the frontend
  dictionaries rather than Rails' `devise.en.yml` string.

## Non-goals

- **Translating database-backed content** — course/module/exercise/quiz
  titles, descriptions, topics, body content. Already flagged as a separate
  future project in the courses-module spec; untouched here.
- **A language switcher for guests.** The pre-auth Login page has no
  switcher; unauthenticated visitors always see Portuguese. Easy to add
  later if needed.
- **Any Rails-side I18n** — no `config/locales/*.yml` additions, no
  `I18n.locale`, no translated flash/mailer content. The frontend owns all
  UI copy end to end.
- **Pluralization, date/number formatting, RTL.** Not needed for PT/EN
  chrome text; the two hardcoded day-abbreviation and date strings in the
  dashboard/plan pages are handled as plain dictionary entries, not a
  formatting library.

## Data model

Add `locale` to `users`:

| column   | type            | notes                                  |
|----------|-----------------|------------------------------------------|
| `locale` | integer, not null | enum `{ pt: 0, en: 1 }`, default `0` (pt) |

A plain `add_column` migration, matching the style of the existing
`AddProfileFieldsToUsers` migration. No backfill needed — the default
covers existing seed users.

## Backend

- `User` model: `enum :locale, { pt: 0, en: 1 }, default: :pt`.
- `ApplicationController#inertia_share` adds `locale: current_user&.locale ||
  "pt"` to the shared hash, so every Inertia response (authenticated or not)
  carries the active locale.
- New route: `patch "/locale", to: "locales#update"`.
  `LocalesController < ApplicationController` (requires
  authentication): validates `params[:locale]` is `"pt"` or `"en"`
  (400/no-op otherwise), calls `current_user.update!(locale: params[:locale])`,
  then `redirect_back fallback_location: dashboard_path`. This mirrors the
  existing `CoursesController#complete` PATCH+redirect pattern, so it rides
  on the same Inertia `router.patch` mechanics already proven to work
  (CSRF, partial reload) — no bespoke JSON endpoint or manual fetch needed.
- `SessionsController#new`: change
  `errors: flash[:alert] ? { base: flash[:alert] } : {}` to
  `errors: flash[:alert] ? { base: "invalid_credentials" } : {}` — a stable
  key instead of Devise's raw English sentence, so `Login.tsx` can translate
  it like any other string.

## Frontend

### Translation dictionaries

`app/frontend/i18n/translations/en.ts` and `pt.ts` — nested plain objects,
namespaced by page/section: `common.nav.*`, `common.status.*` (completed/in
progress/open/locked pills), `auth.login.*`, `dashboard.*`, `courses.*`,
`exercises.*`, `plan.*`, `profile.*`. `pt.ts` is declared
`satisfies typeof en`, so a missing or extra key is a `tsc` compile error,
not a silent runtime gap.

### `useTranslation` hook

`app/frontend/i18n/useTranslation.ts` reads `locale` straight off
`usePage().props` — already available on every page via the `SharedProps`
Inertia type augmentation, so no provider/context wrapper is needed. It
returns `t(key, vars?)` and `locale`:

```ts
export function useTranslation() {
  const { locale } = usePage<SharedProps>().props
  const dict = translations[locale]

  function t(key: TranslationKey, vars?: Record<string, string | number>) {
    const template = getByPath(dict, key)
    return vars ? interpolate(template, vars) : template
  }

  return { t, locale }
}
```

`TranslationKey` is a `DotPaths<typeof en>` utility type, so `t()` calls are
autocompleted and a typo'd key fails to compile. `interpolate` does a plain
`{{name}}` replace, covering the handful of dynamic strings (e.g.
dashboard's "Good afternoon, {{name}}", "{{done}} of {{total}} modules
complete").

### `SharedProps` type

`app/frontend/types/index.ts`: add `export type Locale = 'pt' | 'en'` and
extend `SharedProps` with `locale: Locale`.

### Migrating existing strings

Every hardcoded string in the 9 pages and shared components is replaced
with `t('...')` calls; values that come from props/DB (names, titles,
numbers) stay as-is and get passed through `vars` where they're
interpolated into a translated template. This includes strings that are
hardcoded-but-not-in-a-page-file today, e.g. the "Beginner"/"Intermediate"/
"Advanced" level cards in `Courses/Index.tsx` and the sample weekly-plan
rows in `Dashboard/Home.tsx` — they're static JSX, not DB content, so they
're in scope like everything else.

Repeated vocabulary gets one shared key instead of a copy per page:
`common.signOut` (sidebar + Profile page both say "Sign out"),
`common.back` ("← Back" in `Courses/Quiz.tsx` and `Exercises/Show.tsx`), and
a single `common.status.*` namespace for the done/in-progress/open/locked
pill vocabulary that today is duplicated with slightly different wording
across `Dashboard/Home.tsx`, `Courses/Index.tsx`, and the apparently-unused
`StatusBadge` component (worth a quick check during implementation whether
`StatusBadge` is dead code — it's not imported by either page that renders
status pills today).

**Weekly-plan day labels are a special case.** `PlanController#index`
currently passes `days: DashboardData::DAYS` (`%w[Monday Tuesday ...]`) and
`shortDay: DashboardData::SHORT_DAY` (`{"Monday" => "MON", ...}`) as props,
and `Plan/Index.tsx` renders `shortDay[day]` directly — so the visible
"MON"/"TUE" column headers are actually hardcoded English text coming from
a Ruby constant, not the frontend. Per "frontend owns all UI copy", the fix
is: keep `days` as-is (it's only ever used as a React key / plan object key,
never rendered — same pattern as the existing `'done' | 'current' | 'locked'`
`ModuleStatus` identifiers), drop `shortDay` from the props entirely, and
have `Plan/Index.tsx` render `t(\`common.days.short.${day.toLowerCase()}\`)`
instead. `Dashboard/Home.tsx`'s separate local `WEEK` array (its own
unrelated `MON`/`TUE`/... labels for the "this week" status widget) uses the
same `common.days.short.*` keys.

### Language switcher

A new row on `Profile/Show.tsx`, below the existing info rows: a PT/EN
segmented control. Selecting a language calls
`router.patch('/locale', { locale: 'en' }, { preserveScroll: true })`. The
resulting redirect re-shares props with the new `locale`, and since every
component reads `t()` fresh off `usePage()` on each render, the entire UI
(including the sidebar) updates immediately with no client-side state to
manage beyond what Inertia already does.

### PT copy

Initial Portuguese strings for every key are drafted as part of this
implementation (natural European Portuguese) — a first pass for you to
review and refine afterward, not final copy.

## Testing

- Model spec: `User#locale` accepts `"pt"`/`"en"` and rejects other values
  via the enum.
- Request spec: `PATCH /locale` updates `current_user.locale` and redirects;
  an invalid value is rejected without raising or persisting.
- `npm run check` is the main guardrail against translation-key
  drift — `pt.ts satisfies typeof en` fails to compile on any mismatch
  between the two dictionaries.
- Manual pass: click through all 9 pages in both locales, confirming no
  leftover hardcoded strings and no layout breakage from longer Portuguese
  text (e.g. sidebar nav labels, pill labels).
