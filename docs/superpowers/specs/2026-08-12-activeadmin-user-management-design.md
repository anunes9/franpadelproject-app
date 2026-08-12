# ActiveAdmin for user management

## Overview

Adds an admin panel (ActiveAdmin) so admins can view, search, edit, create,
and delete app users, reusing the existing `User` model and its `role`
enum rather than introducing a separate admin-user system.

This is deliberately scoped to users only. The app's actual "content"
(course modules, exercises, quizzes, weekly plans) is currently all
hardcoded in `app/models/dashboard_data.rb`, not backed by real tables —
turning that into real, admin-manageable data is a separate, much larger
follow-up project (also anticipated as a "Content admin CMS" in the
[auth foundation spec](2026-08-11-rails-inertia-auth-foundation-design.md)'s
future work).

## Goals

- Admins (`User#role == :admin`) can sign into `/admin` using their
  existing app credentials and manage users: search/filter, view details,
  edit email/role, create new users, delete users.
- Non-admin users (sales/client) and anonymous visitors cannot reach
  `/admin`.
- ActiveAdmin's assets (JS/CSS) render correctly under this app's actual
  asset setup (Propshaft, no Sprockets, Vite for the React frontend) — not
  the Sprockets-era setup most ActiveAdmin tutorials assume.
- A repeatable way to create an admin account outside of `db/seeds.rb`
  (which is dev-only convenience data), for use on staging/production.

## Non-goals

- Any content model (modules, exercises, quizzes, plans) — stays in
  `DashboardData` for now; not registered in ActiveAdmin because there's
  nothing real to manage yet.
- A dedicated authorization framework (CanCanCan/Pundit). The only
  permission check needed is "is this user an admin," which a single
  controller method covers; adding a full authorization adapter would be
  premature.
- Devise modules beyond what `User` already has (`:confirmable`,
  `:lockable`, etc.) — out of scope here, same as the auth foundation spec.
- Any deploy/CI/Dockerfile setup — this app has none yet (confirmed: no
  Dockerfile, no `config/deploy.yml`, no render.yaml). The rake task is
  written to be deploy-target-agnostic.

## Architecture

- `activeadmin` gem, installed against the existing `User` model:
  `rails g active_admin:install User --skip-users --skip-comments`.
  - `--skip-users` prevents the generator from re-running Devise's
    generator against `User` (which already has `database_authenticatable`
    and a matching migration; re-running it would try to add columns that
    already exist).
  - `--skip-comments` skips ActiveAdmin's resource-commenting feature
    (and its migration) — not needed for a users-only panel.
  - Passing `User` (rather than the default `AdminUser`) still makes the
    generator fill in the initializer's method names correctly
    (`authenticate_user!`, `current_user`, `destroy_user_session_path`),
    even though those specific lines are commented out by `--skip-users`
    and need one manual edit (see Components).
- **Asset pipeline** — verified against ActiveAdmin 3.5's actual source
  (it dropped jQuery; views now use `javascript_importmap_tags` and a
  Tailwind-based `active_admin.css`) and against ActiveAdmin's own
  CI-tested Rails app template, rather than older Sprockets/jQuery-era
  guidance that no longer applies:
  - `importmap-rails`, via `rails importmap:install`. ActiveAdmin's engine
    auto-registers its own JS under `app.config.importmap` and
    `app.config.assets.paths` (Propshaft supports `assets.paths`) — no
    manual wiring needed once the gem is present. Doesn't collide with the
    existing Vite setup (`app/frontend`) since importmap-rails uses
    `app/javascript`.
  - `cssbundling-rails`, via `rails css:install:tailwind`, then repointed
    at ActiveAdmin's generated `app/assets/stylesheets/active_admin.css`
    (input) → `app/assets/builds/active_admin.css` (output, served by
    Propshaft) instead of the default `application.tailwind.css` (which
    gets removed — this app's main frontend already has its own Tailwind
    build via `@tailwindcss/vite`, so a second unused entrypoint would just
    be dead weight). Reuses the `tailwindcss` npm package already in
    `package.json`; no new Node tooling. This hooks `css:build` into
    `assets:precompile` and `test:prepare` automatically. No watcher added
    to `Procfile.dev` for now — admin styling changes rarely; a manual
    `bin/rails css:build` after editing `active_admin.css` is enough to
    start with.

## Data model

No schema changes to `users`. The `role` enum (`admin`/`sales`/`client`)
already exists and is reused as-is for the admin-access check.

## Components

- `ApplicationController#authenticate_admin!` (private) — calls
  `authenticate_user!`, then redirects to `root_path` with an alert if
  `current_user` is not `admin?`. This is the one authorization check the
  app needs.
- `config/initializers/active_admin.rb` — generated file, hand-edited to
  set:
  - `config.authentication_method = :authenticate_admin!`
  - `config.current_user_method = :current_user`
  - `config.logout_link_path = :destroy_user_session_path` (already
    correct as generated — matches Devise's existing route helper).
- `config/routes.rb` — `ActiveAdmin.routes(self)` added after `devise_for
  :users, ...`, matching Devise/ActiveAdmin's documented route ordering
  requirement.
- `app/admin/users.rb` — the `User` ActiveAdmin resource:
  - `index`: email, role, created_at, with filters on email and role.
  - `permit_params :email, :role, :password, :password_confirmation`.
  - Form shows email, role (select from `User.roles.keys`), password,
    password confirmation.
  - Controller override strips blank `password`/`password_confirmation`
    from the update params so editing a user doesn't force re-entering
    their password — the standard ActiveAdmin+Devise pattern.
  - Default actions (index/show/new/edit/destroy) all enabled — matches
    "view & search, edit, create/delete."
- `lib/tasks/admin.rake` — `rails admin:create EMAIL=... PASSWORD=...`:
  idempotent (`find_or_initialize_by(email:)`, sets `role: :admin`,
  updates the password if given), prints validation errors and exits
  non-zero on failure instead of raising. Intended for staging/production,
  where `db:seed` (which also creates fake sales/client accounts) isn't
  the right tool.

## Data flow

- Admin visits `/admin` → `authenticate_admin!` runs → if not logged in,
  Devise's normal `authenticate_user!` redirect to login kicks in; if
  logged in but not `admin?`, redirected to `root_path` with an alert; if
  admin, ActiveAdmin renders normally.
- Editing a user via the admin form: submitting with blank password fields
  updates only email/role; submitting with a new password updates it via
  Devise's normal `password=`/`password_confirmation=` (which re-encrypts
  and validates via `:validatable`).
- `rails admin:create` is a one-off CLI operation, no HTTP involved.

## Error handling

- Non-admin authenticated user hitting `/admin` → redirected with a
  visible alert, not a bare 403.
- Admin form validation errors (invalid email, mismatched password
  confirmation) → standard ActiveAdmin/Formtastic inline error rendering,
  no custom handling needed.
- `admin:create` with invalid email/password → prints the model's
  validation errors and exits with a non-zero status; does not raise an
  unhandled exception.

## Testing

- RSpec + FactoryBot (already in use).
- `spec/requests/admin/users_spec.rb`:
  - Admin can reach `/admin/users` (200).
  - Non-admin (sales/client) redirected away from `/admin/users`.
  - Anonymous visitor redirected to login.
  - Admin can create a user, edit a user's role, delete a user.
  - Editing a user without touching the password field leaves their
    existing password valid (regression check for the strip-blank-password
    override).
- `spec/tasks/admin_create_spec.rb` (or inline `rake_helper`-based spec):
  - Running the task creates a user with `role: admin`.
  - Running it again with the same email updates rather than duplicating.
  - Invalid input (e.g. blank password) fails without raising.

## Future specs (explicitly deferred)

- Content admin CMS: real DB models for course modules, exercises,
  quizzes, and weekly plans (replacing `DashboardData`), registered in
  ActiveAdmin alongside users.
- A `Procfile.dev` watcher for ActiveAdmin's CSS, if manual rebuilds prove
  annoying in practice.
