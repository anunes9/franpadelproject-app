# Rails + Inertia auth foundation

## Overview

First sub-project of the broader move from the current Next.js + Supabase
stack to Rails + Inertia.js. This spec covers only the foundation: a new
Rails app capable of serving an Inertia/React frontend, with a minimal
password-based login/logout flow proving the session works end-to-end.

This is deliberately narrow. The full migration spans several independent
subsystems — this foundation, a full frontend port of the existing
dashboard, a content admin CMS, a memberships/billing system, and migration
of the remaining Supabase tables — each of which gets its own spec once this
foundation is in place.

## Goals

- Stand up a Rails app in this repo that serves React pages via Inertia.
- Support email + password login and logout, backed by Devise.
- Persist a `role` (admin/sales/client) on the user, matching the existing
  Supabase `user_role` enum's values.
- Prove the authenticated-session flow works: login → redirect to a
  placeholder dashboard page → logout → redirect back to login.
- All database tables use UUID primary keys.

## Non-goals

- Password reset, invite, email confirmation, and OTP/magic-link flows —
  all exist (some disabled) in the current Next.js app and will be specced
  as a follow-up once this foundation is proven, by subclassing the
  relevant Devise controllers the same way this spec subclasses
  `SessionsController`.
- Porting the real dashboard/courses/exercises/plan/profile screens —
  separate future spec. This spec's only frontend page beyond login is a
  bare placeholder to prove the session works.
- Content admin CMS, memberships/billing — separate future specs, no
  dependency on this one beyond needing a logged-in user.
- Migrating the other 5 Supabase tables (`quiz_attempts`, `module_progress`,
  `weekly_plans`, `weekly_plan_modules`, `exercise_progress`) or any real
  user data — the current Supabase `users` table only has test/dev data, so
  there's nothing to import; this spec seeds 1-2 test accounts instead.
- Hosting, CI/CD, Dockerfile, or any production deployment concern — local
  dev only.

## Architecture

- New `rails/` directory at the repo root, alongside the existing `src/`,
  `supabase/`, `docs/`, etc. — one git history, two stacks living side by
  side during the transition. The existing Next.js app is untouched.
- Rails 8.x, Ruby 3.3+.
- Fresh local Postgres database — not the existing Supabase Postgres
  instance. Postgres 13+'s built-in `gen_random_uuid()` is used for UUID
  primary keys, so no `pgcrypto`/`uuid-ossp` extension is required.
- `inertia_rails` gem serving React 19 + TypeScript pages, bundled via
  `vite_rails` (the standard Inertia+Rails+Vite combination).
- Devise (`database_authenticatable`) for password auth. Devise's
  controllers are subclassed rather than used as-is, since Devise's
  defaults render ERB views and issue standard redirects that don't fit
  Inertia's request/response cycle.
- Local dev only: `bin/dev` running Rails + Vite, local Postgres. No
  hosting provider, CI, or Dockerfile in this spec.

## Data model

Single table for this spec:

```
users
  id            uuid (primary key, default gen_random_uuid())
  email         string, unique, not null
  encrypted_password  string, not null (Devise's database_authenticatable column)
  role          enum: admin, sales, client (matches Supabase's user_role)
  timestamps
```

`config.generators.orm :active_record, primary_key_type: :uuid` is set at
the app level so every future migration defaults to UUID primary keys
without needing to specify it per-table.

## Components

- `User` model — Devise `:database_authenticatable`; `role` enum column.
  Further Devise modules (`:recoverable`, `:confirmable`, etc.) are added in
  the follow-up auth-flows spec, not here.
- `SessionsController < Devise::SessionsController` — overrides `create`
  and `destroy` to redirect via Inertia instead of Devise's default
  ERB/redirect flow. Future specs (password reset, invite) follow the same
  pattern: subclass the matching Devise controller
  (`Devise::PasswordsController`, etc.) rather than writing auth logic from
  scratch.
- `ApplicationController` — `before_action :authenticate_user!` for
  protected routes; shares `current_user` (email + role) as an Inertia prop
  available to every page via `inertia_share`.
- `app/javascript/pages/Auth/Login.tsx` — Inertia React login page (email +
  password form, posts via `router.post`).
- `app/javascript/pages/Dashboard/Home.tsx` — bare placeholder page shown
  after login, just enough to prove the session works. Not the real
  dashboard.

## Data flow

- **Login**: `Login.tsx` submits via `router.post` to `sessions#create` →
  Warden validates the password → `sign_in(resource)` → redirect to the
  dashboard. Inertia follows the redirect; the dashboard page renders with
  `current_user` available as a shared prop.
- **Logout**: Inertia `router.delete` to `sessions#destroy` → `sign_out` →
  redirect to login.
- **Failed login**: `create` rescues `Warden::NotAuthenticated` and
  redirects back to the login page with errors passed as an Inertia prop;
  `Login.tsx` reads `props.errors` and displays them inline — no full-page
  reload, no Devise flash-based error view.

## Error handling

- Invalid credentials → redirected back to login with an inline error.
- Already-authenticated user visiting the login page → redirected straight
  to the dashboard.
- Unauthenticated visitor to a protected route → Devise's
  `authenticate_user!` redirects to login (standard Warden behavior),
  storing the originally requested path so a later spec can redirect back
  to it after login.

## Testing

- RSpec + FactoryBot.
- `spec/models/user_spec.rb` — validations, role enum values.
- `spec/requests/sessions_spec.rb` — successful login redirects to the
  dashboard; wrong password redirects to login with an error; logout clears
  the session and redirects to login; an unauthenticated visit to a
  protected route redirects to login.
- No system/feature (headless browser) specs in this spec — request specs
  are sufficient for a backend-driven login flow with no real UI yet.
  System specs get added once the real dashboard UI exists to click
  through.

## Future specs (explicitly deferred)

- Password reset, invite, and OTP/magic-link auth flows.
- Full frontend port of the dashboard/courses/exercises/plan/profile
  screens as Inertia pages.
- Content admin CMS (courses/modules/exercises/quizzes), replacing static
  JSON + the planned Notion sync.
- Memberships/billing (plans, entitlements) — no existing infrastructure to
  build on beyond the unused `payment_status` enum in the current Supabase
  schema.
- Migrating `quiz_attempts`, `module_progress`, `weekly_plans`,
  `weekly_plan_modules`, `exercise_progress` into Rails.
- Hosting, CI/CD, Dockerfile, production deployment.
