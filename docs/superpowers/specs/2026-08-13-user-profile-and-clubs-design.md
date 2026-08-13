# Real user profiles and a Club module

## Overview

Replaces the hardcoded `DashboardData::USER` constant (a fake "Miguel
Santos" persona shown to every signed-in user regardless of who's actually
logged in) with real data stored on `User`, and introduces a `Club` model
so a user's club is a real, admin-manageable record instead of a free-text
string. This is the same shape of work as the courses module: move
content that used to live in a Ruby constant into the database.

The old pre-Rails app (`docs/old-app/migrations/001_initial_schema.sql`)
only ever treated "club" as a `club_name`/`club_avatar_url` string pair
directly on `users` — no separate club entity, no admin management. This
design goes a step further: `Club` is a first-class model with its own
ActiveAdmin resource, and `User belongs_to :club`.

## Goals

- `Profile/Show.tsx` and the sidebar/header (`shell.tsx`'s `dashboardUser`
  share) show the *actual* signed-in user's name, initials, age, skill
  level, dominant hand, club, and join date — not a shared hardcoded mock.
- A `Club` has a name (required, unique), an optional location, an
  optional Instagram link, and an optional logo image (Active Storage,
  same upload pattern as course module documents).
- Admins manage clubs (create/edit/delete, upload/remove a logo) and
  assign a user to a club, via ActiveAdmin.
- Club membership is optional — `admin`/`sales` accounts aren't players
  and don't need one. `age`, `level`, and `hand` are optional too.
- The 3 seed users keep looking the same after this ships: `client@example.com`
  gets `name: "Miguel Santos", age: 34, level: :beginner, hand: :right`,
  and a real `Club` named "Padel Clube Lisboa" — the exact values the old
  constant hardcoded.

## Non-goals

- Self-service profile editing. `Profile/Show.tsx` stays read-only
  (display + sign out); there's still no UI for a user to edit their own
  name/age/level/hand/club. Only admins can set these, via ActiveAdmin.
- Multiple clubs per user, club membership history, or any join-table
  richer than a single `belongs_to`.
- Any change to `User#role`, Devise modules, or authentication — untouched.
- Displaying the club's logo/location/Instagram link anywhere in the app
  yet. They're captured and admin-manageable now so that data exists, but
  `Profile/Show.tsx` and `shell.tsx` keep showing just the club's `name`,
  matching what they show today. Surfacing the logo is a natural, cheap
  follow-up once there's an actual place in the UI designed for it.

## Data model

### `clubs`

| column      | type   | notes                                    |
|-------------|--------|-------------------------------------------|
| `id`        | uuid   | same convention as every other table       |
| `name`      | string, not null | unique index                    |
| `location`  | string, nullable | free text, e.g. "Lisboa, Portugal" |
| `instagram` | string, nullable | free text (handle or URL)          |
| `logo`      | —      | `has_one_attached :logo` (Active Storage, tables already exist from the course-module-documents feature — no new migration for this part) |
| `created_at`/`updated_at` | timestamps | |

### `users` (new columns)

| column     | type    | notes |
|------------|---------|-------|
| `name`     | string, **not null** | See "Migration safety" below — existing rows get backfilled before the constraint is added. |
| `age`      | integer, nullable | optional |
| `level`    | integer, nullable | enum `{ beginner: 0, intermediate: 1, advanced: 2 }`, no default — the *player's* skill, unrelated to `CourseModule#level` |
| `hand`     | integer, nullable | enum `{ left: 0, right: 1 }`, no default |
| `club_id`  | uuid, nullable, FK → `clubs` | `belongs_to :club, optional: true` |

`initials` and "member since" are **not** columns — they're computed from
`name` and `created_at` respectively (see Components).

### Migration safety

`users` already has 3 rows (the seed accounts). Adding `name` as
`NOT NULL` directly would fail against the existing dev database. The
migration backfills before adding the constraint:

```ruby
class AddProfileFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string
    add_column :users, :age, :integer
    add_column :users, :level, :integer
    add_column :users, :hand, :integer
    add_reference :users, :club, type: :uuid, foreign_key: true

    reversible do |dir|
      dir.up { execute "UPDATE users SET name = split_part(email, '@', 1) WHERE name IS NULL" }
    end

    change_column_null :users, :name, false
  end
end
```

`db/seeds.rb` then overwrites those placeholder names with the real ones
(see Seeding).

## Components

### `Club` model

```ruby
class Club < ApplicationRecord
  has_one_attached :logo
  has_many :users, dependent: :nullify

  validates :name, presence: true, uniqueness: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[name location instagram created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
```

`dependent: :nullify` (not `:destroy`) — deleting a club shouldn't delete
its members, just leave them clubless.

### `User` additions

```ruby
enum :level, { beginner: 0, intermediate: 1, advanced: 2 }
enum :hand, { left: 0, right: 1 }

belongs_to :club, optional: true

def initials
  name.to_s.split.first(2).map { |word| word[0] }.join.upcase
end

def member_since
  created_at.strftime("%b %Y")
end

# Small shape shell.tsx's Sidebar/MobileHeader already expect.
def dashboard_profile_json
  { name: name, initials: initials, club: club&.name }
end

# Fuller shape for Profile/Show.tsx.
def profile_json
  {
    name: name,
    initials: initials,
    email: email,
    role: role,
    age: age,
    level: level&.capitalize,
    hand: hand&.capitalize,
    club: club&.name,
    memberSince: member_since
  }
end
```

`ransackable_attributes` gains `club_id` (so the admin's club filter,
which submits `club_id_eq`, is allowed through Ransack's safelist).

### Controllers

```ruby
# DashboardController
inertia_share do
  { dashboardUser: current_user.dashboard_profile_json }
end
```

```ruby
# ProfileController
def index
  render inertia: "Profile/Show", props: { profile: current_user.profile_json }
end
```

`DashboardData::USER` is deleted from `app/models/dashboard_data.rb` —
nothing references it after this.

### ActiveAdmin

`app/admin/clubs.rb` (mirrors `course_modules.rb`'s single-file-attachment
pattern from the documents feature):

- `permit_params :name, :location, :instagram, :logo`
- Index: name, location, instagram, actions
- Form: name, location, instagram, then a "Logo" section showing the
  current logo (if attached, with a "Remove" link via a `member_action`
  purging it) followed by a file input for uploading a new one.

`app/admin/users.rb` gains, inside the existing form:

- `f.input :name`
- `f.input :age`
- `f.input :level, as: :select, collection: User.levels.keys, include_blank: true`
- `f.input :hand, as: :select, collection: User.hands.keys, include_blank: true`
- `f.input :club, as: :select, collection: -> { Club.order(:name) }, include_blank: true`

And a filter: `filter :club, as: :select, collection: -> { Club.order(:name) }`.

### Frontend

`app/frontend/types/dashboard-data.ts`:
```diff
 export interface DashboardUser {
   name: string
   initials: string
-  club: string
+  club: string | null
 }
```

`Profile/Show.tsx`'s `Profile` interface gains `level: string | null` and
`hand: string | null`; `age`/`club` become `number | null` / `string | null`.
Its `rows` array renders `'—'` for any null field instead of the literal
string `"null"` that `String(null)` produces today:

```ts
const rows: Array<[string, string]> = [
  ['Email', profile.email],
  ['Role', profile.role],
  ['Age', profile.age ? String(profile.age) : '—'],
  ['Level', profile.level ?? '—'],
  ['Hand', profile.hand ?? '—'],
  ['Club', profile.club ?? '—'],
]
```

The header line (`{profile.club} · Member since {profile.memberSince}`)
becomes conditional — when `profile.club` is null, it renders just
`Member since {profile.memberSince}`.

`shell.tsx`'s `Sidebar`/`MobileHeader` wrap their club `<div>` in
`{dashboardUser.club && (...)}` so admin/sales accounts (no club) simply
don't show that line, instead of rendering it empty.

### Seeding

`db/seeds.rb` gains, before the `User.find_or_create_by!` blocks (so the
club exists first):

```ruby
club = Club.find_or_create_by!(name: "Padel Clube Lisboa") do |c|
  c.location = "Lisboa, Portugal"
end
```

Each existing `User.find_or_create_by!` block sets `name` (all 3), and
the `client@example.com` block additionally sets `age: 34, level: :beginner,
hand: :right, club: club`.

## Testing

- Model specs: `Club` validity/uniqueness, `has_one_attached :logo`.
  `User#initials` (two-word name, one-word name, nil name), `#member_since`
  format, `#dashboard_profile_json`/`#profile_json` output shape with and
  without a club/age/level/hand set.
- `spec/factories/users.rb` gains a `name` (e.g. a sequence) — required
  now that `name` validates presence; every existing spec using
  `create(:user)`/`build(:user)` must keep passing unchanged.
- Request specs: `spec/requests/admin/clubs_spec.rb` (list, create,
  update, delete, upload/remove logo — mirrors
  `spec/requests/admin/course_modules_spec.rb`). `spec/requests/admin/users_spec.rb`
  gains a case assigning a club. `spec/requests/dashboard_spec.rb` and
  `spec/requests/profile_spec.rb` assert the real user's name (not
  "Miguel Santos") appears in the response body.
- Seed verification: after `rails db:seed`, `Club.count == 1` and
  `User.find_by(email: "client@example.com").club.name == "Padel Clube Lisboa"`.
