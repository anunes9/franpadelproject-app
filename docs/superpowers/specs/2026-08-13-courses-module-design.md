# Courses module: real content + per-user progress

## Overview

Moves the "Courses" feature (`app/frontend/pages/Courses/*`, plus the module
list on the dashboard home page) off the hardcoded `DashboardData::MODULES` /
`DashboardData::MODULE_1_SECTIONS` constants and onto two real tables:
`course_modules` (content, admin-manageable) and `user_module_progresses`
(per-user status/progress, currently seed-only).

This picks up where the [ActiveAdmin user management
spec](2026-08-12-activeadmin-user-management-design.md) explicitly deferred
("the app's actual content ... is currently all hardcoded ... turning that
into real, admin-manageable data is a separate, much larger follow-up
project"). It's the first slice of that follow-up, scoped to modules only.

The old pre-Rails app (`docs/old-app/`) split this the same way: module
*content* lived in Contentful (exported here as `docs/courses/beginner.json`
and `intermediate.json`, bilingual `pt`/`en-US`), while Postgres/Supabase
only stored per-user data — `quiz_attempts`, `module_progress`,
`weekly_plans`. This design mirrors that split: `course_modules` is content,
`user_module_progresses` is per-user state.

## Goals

- Module content (title, description, topics, duration, body sections) is
  real DB data, editable via ActiveAdmin, instead of a Ruby constant that
  requires a code deploy to change.
- Seed content is imported from `docs/courses/beginner.json`'s **`pt`**
  fields (title, description, topics, duration, content), for all 8
  modules. This also fixes an existing bug: today, `CoursesController#show`
  falls back to `DashboardData::MODULE_1_SECTIONS` for any module that
  doesn't define its own `sections`, which is every module except module 1
  — modules 2 through 8 currently render module 1's body content. Importing
  the real per-module content from the JSON export fixes this as a
  byproduct.
- Each module's `status` (locked/current/done) and `progress` (0-100) are
  tracked per user in a new table, seeded with today's exact values so the
  UI is visually unchanged for the three existing seed users.
- The frontend's `Module` TypeScript type and every component that consumes
  it (`ModuleCard`, `StatusBadge`, `ProgressBar`, `Courses/Index.tsx`,
  `Courses/Show.tsx`, `Dashboard/Home.tsx`) are untouched — the controllers
  keep emitting the exact same JSON shape they do today. The only frontend
  edit is one line in `Home.tsx` (see Components).

## Non-goals

- **Exercises and Quiz** stay exactly as they are today — hardcoded in
  `DashboardData`, not persisted, not migrated. `CoursesController#show`
  still filters `DashboardData::EXERCISES` by `moduleId == course_module.slug`;
  `#quiz` still renders `DashboardData::QUIZ` unchanged.
- **No write path to `user_module_progresses` yet.** Submitting the
  knowledge check in `Courses/Quiz.tsx` still doesn't persist anything — a
  refresh still resets it, same as today. Wiring quiz completion (or
  exercise completion) to actually update progress is a separate future
  slice, closer to the old app's `quiz_attempts` → `module_progress`
  trigger.
- **No `Course` table.** Only "Beginner" has real module content today;
  Intermediate and Advanced are still locked placeholder cards, hardcoded
  in `Courses/Index.tsx`'s `LEVELS` array, untouched by this change.
  `CourseModule` gets a `level` enum directly instead of belonging to a
  separate `Course` record — if Intermediate/Advanced content actually
  arrives later, promoting `level` into a real `Course` association is a
  small follow-up, not a rewrite.
- **No admin UI for progress.** `UserModuleProgress` is not registered in
  ActiveAdmin this slice — manually editing a client's progress from the
  admin panel is a reasonable future add-on, not built here.
- **No localization infrastructure.** Only the `pt` fields from the JSON
  export are imported into the single `content`/`title`/etc. columns; the
  `en-US` fields are left unused. If the app needs to serve both languages
  later, that's a real i18n project (locale-keyed columns or a separate
  translations table), not something this schema attempts.

## Data model

### `course_modules`

| column        | type                | notes                                             |
|---------------|---------------------|----------------------------------------------------|
| `id`          | uuid, PK            | `default: -> { "gen_random_uuid()" }`, matches `users` |
| `slug`        | string, not null    | `"module-1"` … `"module-8"`; unique index. This is what URLs (`/dashboard/courses/:id`) and `DashboardData::EXERCISES`' `moduleId` already key off — no route changes needed. |
| `level`       | integer, not null   | enum `{ beginner: 0, intermediate: 1, advanced: 2 }`, default `beginner` |
| `position`    | integer, not null   | replaces today's `n`; ordering within a level |
| `title`       | string, not null    | seeded from `title.pt` |
| `description` | string, not null    | seeded from `description.pt` |
| `duration`    | string, not null    | seeded from `duration.pt` (e.g. `"2 - 4 semanas"`) |
| `topics`      | jsonb, not null, default `[]` | array of strings, seeded from `topics.pt` |
| `content`     | text, nullable       | raw markdown body, seeded verbatim from `content.pt` (`## Heading` + `- item;` lines) |
| `created_at` / `updated_at` | timestamps | |

Indexes: unique on `slug`; index on `(level, position)`.

### `user_module_progresses`

| column             | type              | notes                                    |
|--------------------|-------------------|-------------------------------------------|
| `id`               | uuid, PK          | |
| `user_id`          | uuid, not null    | FK → `users` |
| `course_module_id` | uuid, not null    | FK → `course_modules` |
| `status`           | integer, not null | enum `{ locked: 0, current: 1, done: 2 }`, default `locked` |
| `progress`         | integer, not null, default `0` | 0-100 |
| `created_at` / `updated_at` | timestamps | |

Indexes: unique on `(user_id, course_module_id)`.

## Components

### `CourseModule` model

```ruby
class CourseModule < ApplicationRecord
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }, default: :beginner

  has_many :user_module_progresses, dependent: :destroy

  validates :slug, :title, :description, :duration, presence: true
  validates :slug, uniqueness: true

  scope :ordered, -> { order(:level, :position) }

  # Comma-separated virtual attribute for the ActiveAdmin form — `topics`
  # itself stays a real string array.
  def topics_text
    topics.join(", ")
  end

  def topics_text=(value)
    self.topics = value.to_s.split(",").map(&:strip).reject(&:blank?)
  end

  # Parses the markdown `content` into the {heading, items[]} shape
  # ContentSection already expects on the frontend. "## Heading" starts a
  # section; "- item;" lines become its items.
  def sections
    return [] if content.blank?

    content.split(/^## /).reject(&:blank?).map do |chunk|
      heading, *rest = chunk.strip.lines.map(&:strip)
      items = rest.select { |line| line.start_with?("- ") }.map { |line| line.delete_prefix("- ") }
      { heading: heading, items: items }
    end
  end

  # Builds the exact hash shape the frontend's `Module` type expects.
  # `progress` is the caller's UserModuleProgress row, or nil for a user
  # with no row yet (defaults to locked/0 — never raises).
  def as_dashboard_json(progress = nil)
    {
      id: slug,
      n: position,
      title: title,
      description: description,
      topics: topics,
      duration: duration,
      level: level.capitalize,
      status: progress&.status || "locked",
      progress: progress&.progress || 0
    }
  end

  # Batches the progress lookup for a list of modules (avoids N+1).
  def self.dashboard_list_for(user)
    modules = ordered.to_a
    progresses = UserModuleProgress.where(user: user, course_module_id: modules.map(&:id))
                                    .index_by(&:course_module_id)
    modules.map { |m| m.as_dashboard_json(progresses[m.id]) }
  end
end
```

### `UserModuleProgress` model

```ruby
class UserModuleProgress < ApplicationRecord
  belongs_to :user
  belongs_to :course_module

  enum :status, { locked: 0, current: 1, done: 2 }, default: :locked

  validates :progress, numericality: { in: 0..100 }
end
```

`User` gets `has_many :user_module_progresses, dependent: :destroy`.

### Controllers

- `DashboardController#index` and `CoursesController#index` replace
  `DashboardData::MODULES` with `CourseModule.dashboard_list_for(current_user)`.
- `CoursesController#show`:
  ```ruby
  def show
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module

    progress = UserModuleProgress.find_by(user: current_user, course_module: course_module)
    exercises = DashboardData::EXERCISES.select { |e| e[:moduleId] == course_module.slug }

    render inertia: "Courses/Show", props: {
      courseModule: course_module.as_dashboard_json(progress),
      sections: course_module.sections,
      exercises: exercises
    }
  end
  ```
- `CoursesController#quiz` swaps `DashboardData.find_module(params[:id])` for
  `CourseModule.find_by(slug: params[:id])`; still renders
  `DashboardData::QUIZ` unchanged; `id:` prop becomes `course_module.slug`.

### ActiveAdmin

`app/admin/course_modules.rb`, following the existing `app/admin/users.rb`
pattern:

- `permit_params :slug, :level, :position, :title, :description, :duration, :topics_text, :content`
- Index: `slug`, `title`, `level`, `position`, `actions`
- Filters: `level` (select), `title`
- Form: `slug`, `level` (select), `position`, `title`, `description`,
  `duration`, `topics_text` (labelled "Topics (comma separated)"), `content`
  as a large textarea (`input_html: { rows: 20 }`)

### Seeding

`db/seeds.rb` gains:

1. **`CourseModule` rows** — one per entry in `docs/courses/beginner.json`,
   reading `title.pt`, `description.pt`, `topics.pt`, `duration.pt`,
   `content.pt`, with `level: :beginner` and `position` taken from the
   entry's order (1-8).
2. **`UserModuleProgress` rows** — for each of the 3 seed users
   (`admin@example.com`, `sales@example.com`, `client@example.com`) ×
   all 8 modules, reproducing today's hardcoded values exactly:
   module 1 & 2 → `done`/100, module 3 → `current`/40, modules 4-8 →
   `locked`/0. This keeps the seeded demo visually identical to today for
   all three accounts, and means no user hitting `/dashboard` gets zero
   progress rows.

### Frontend

One line, `app/frontend/pages/Dashboard/Home.tsx`:

```diff
- const current = modules.find((m) => m.status === 'current')!
+ const current = modules.find((m) => m.status === 'current') ?? modules[0]
```

This guards against a future user with no progress rows at all (anyone
created after this ships, outside the three seeded accounts) — `.find(...)!`
would otherwise throw. Falling back to `modules[0]` is a safe default, not a
progress computation; it doesn't change behavior for any of today's seed
users, all of whom have a real `current` module.

No other frontend file changes. `Module`, `ContentSection`, `ModuleCard`,
`StatusBadge`, `ProgressBar`, `Courses/Index.tsx`, `Courses/Show.tsx`,
`Courses/Quiz.tsx` all keep working unmodified because the controllers keep
emitting the same prop shapes they do today.

## Testing

- Model specs: `CourseModule#sections` parses a multi-heading markdown
  fixture into the expected `{heading, items[]}` array, including the
  empty-`content` case (`[]`). `CourseModule.dashboard_list_for` returns
  locked/0 for a user with no progress rows, and the seeded values for a
  seed user. `UserModuleProgress` validates `progress` is within 0..100.
- Request specs: `GET /dashboard/courses` and `GET /dashboard/courses/:id`
  return 200 for a signed-in user and the expected module/section data;
  `GET /dashboard/courses/does-not-exist` returns 404.
- Seed verification: after `rails db:seed`, `CourseModule.count == 8` and
  `UserModuleProgress.count == 24`, and the 3 seed users see the same
  status/progress values the current `DashboardData::MODULES` constant
  hardcodes.
