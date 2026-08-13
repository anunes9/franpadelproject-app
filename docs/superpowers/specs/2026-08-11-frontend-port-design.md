# Frontend port: dashboard pages to Rails + Inertia

## Overview

Second sub-project of the Rails + Inertia migration (after the
[auth foundation](2026-08-11-rails-inertia-auth-foundation-design.md)). Ports
the 8 dashboard pages currently live in the Next.js app
(`src/app/dashboard/**`, branch `feature/design-revamp-v3`) into the Rails
app at `rails/` as Inertia + React pages, replacing the bare
`Dashboard/Home` placeholder built in the auth foundation spec.

The Next.js dashboard's own non-goal — no live Contentful/Supabase reads,
everything reads from static placeholder data — carries over unchanged
here. This spec is a faithful UI port, not a data-wiring project.

## Goals

- Port all 8 dashboard routes (home, courses list, course detail, quiz,
  exercises list, exercise detail, weekly plan, profile) as Inertia/React
  pages under `rails/app/frontend/pages/`.
- Port the shared shell and UI primitives (`shell.tsx`, `ui.tsx`) used
  across those pages.
- Bring Tailwind v4 into the Rails/Vite pipeline for the first time, with
  the same design tokens (`ink`, `teal`, `teal-deep`, `paper`, `line`,
  `mist`, `muted`, `danger`; Archivo + IBM Plex Mono fonts) as
  `src/app/globals.css`.
- Port the static placeholder data (`src/lib/dashboard-data.ts`) as Ruby
  constants, passed to pages as Inertia props per-controller-action.
- Mix real session identity (email/role, already available via
  `ApplicationController`'s `inertia_share`) into the profile page, while
  keeping the rest of its fields as mock data — matching what the current
  Next.js profile page already does (real sign-out, mock everything else).

## Non-goals

- Any real Rails-backed data (ActiveRecord models for courses, exercises,
  quizzes, or weekly plans) — deferred to the future content-admin
  sub-project, which will replace these Ruby constants with real queries
  without needing to change the pages' prop shapes.
- Memberships/billing — separate future sub-project.
- Any auth flow beyond what the auth foundation spec already built
  (password login/logout) — no reset/invite/OTP here.
- Automated JS/component tests (Vitest, React Testing Library, or system
  specs) for the interactive pages (quiz, drag-and-drop plan, exercise
  filter) — verified by manual click-through instead, matching the auth
  foundation spec's testing scope.
- Persisting quiz results, plan assignments, or exercise progress — all
  client-side `useState`, matching the current Next.js behavior.

## Architecture

- Pages live at `rails/app/frontend/pages/` under the existing `Auth/` and
  `Dashboard/` structure: `Dashboard/Home`, `Courses/Index`, `Courses/Show`,
  `Courses/Quiz`, `Exercises/Index`, `Exercises/Show`, `Plan/Index`,
  `Profile/Show`.
- Shared components ported as two files matching the source structure:
  `app/frontend/components/shell.tsx` (`AppShell`, `Sidebar`, `BottomTabs`,
  `PageHeader`) and `app/frontend/components/ui.tsx` (`ProgressBar`,
  `StatusBadge`, `Topic`, `Eyebrow`, `MediaPlaceholder`, `ExerciseCard`,
  `CategoryFilter`). `next/link`/`next/image`/`next/navigation` usages are
  swapped for Inertia's `Link` and `router`.
- Static placeholder data ported as Ruby constants in a `DashboardData`
  module (e.g. `app/models/dashboard_data.rb`), matching
  `dashboard-data.ts`'s shape: `MODULES`, `MODULE_1_SECTIONS`, `EXERCISES`,
  `QUIZ`, `DAYS`, `DEFAULT_PLAN`, `USER`, `COURSE_STATS`, plus lookup
  helpers (`DashboardData.find_module(id)`,
  `DashboardData.find_exercise(ref)`). No ActiveRecord models — these are
  plain Ruby constants, matching the current TS constants' role.
- Tailwind v4 (+ PostCSS) added to the Vite pipeline for the first time;
  `rails/app/frontend/entrypoints/application.css` gets the same `@theme`
  tokens as `src/app/globals.css`. Fonts (Archivo, IBM Plex Mono) loaded
  via a Google Fonts `<link>` tag in `app/views/layouts/application.html.erb`.

## Routing

Mirrors the current Next.js paths exactly, replacing the auth foundation's
placeholder `dashboard#index`:

| Path | Controller#action | Page |
|---|---|---|
| `/dashboard` | `dashboard#index` | `Dashboard/Home` |
| `/dashboard/courses` | `courses#index` | `Courses/Index` |
| `/dashboard/courses/:id` | `courses#show` | `Courses/Show` |
| `/dashboard/courses/:id/quiz` | `courses#quiz` | `Courses/Quiz` |
| `/dashboard/exercises` | `exercises#index` | `Exercises/Index` |
| `/dashboard/exercises/:ref` | `exercises#show` | `Exercises/Show` |
| `/dashboard/plan` | `plan#index` | `Plan/Index` |
| `/dashboard/profile` | `profile#index` | `Profile/Show` |

All routes inherit the existing `before_action :authenticate_user!` pattern
(each new controller follows `DashboardController`'s approach from the
auth foundation spec).

## Data flow

- Each controller action passes the relevant slice of `DashboardData` as
  Inertia props — e.g. `courses#index` passes `DashboardData::MODULES`;
  `courses#show` passes the single module found via
  `DashboardData.find_module(params[:id])` plus `DashboardData::MODULE_1_SECTIONS`
  when `id == "1"`.
- **Profile page**: `profile#index` builds props by merging the real
  `current_user` (email, role — already shared globally via
  `ApplicationController`'s `inertia_share`) with `DashboardData::USER`'s
  mock fields (name, club, member since, age). The logout button posts to
  the existing `sessions#destroy` from the auth foundation spec, unchanged.
- **Quiz, plan, exercise filter**: client-side React state only
  (`useState`), ported as-is from the Next.js versions — no Rails
  persistence. The quiz's scoring/retake logic, the plan's drag-and-drop
  (desktop) and tap-to-assign (mobile) interactions, and the exercise
  category filter all port without needing Rails-side changes beyond
  initial prop data, since none of them depend on Next-specific APIs
  beyond routing.

## Error handling

- `courses#show`, `courses#quiz`, and `exercises#show` render a 404
  (`head :not_found`) when `DashboardData.find_module`/`find_exercise`
  returns `nil` for an unknown `:id`/`:ref` — there's no ActiveRecord model
  to raise `RecordNotFound`, so this is a plain nil-check in each action.
- No other new error states: unauthenticated visits to any dashboard route
  redirect to login via the existing `authenticate_user!` behavior from the
  auth foundation spec, unchanged.

## Testing

- RSpec request specs per route, matching the auth foundation spec's
  pattern: assert `200` plus the correct Inertia `component` name in the
  response body (e.g. `response.body).to include('"component":"Courses/Index"')`),
  plus the two 404 cases above (unknown course id, unknown exercise ref).
- No Vitest, React Testing Library, or system specs in this spec — the
  interactive pages (quiz, plan, exercise filter) are verified by manual
  click-through via `bin/dev` instead, matching the auth foundation spec's
  testing scope.
