# User Profile and Clubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `DashboardData::USER` mock with real per-user profile data, and introduce a `Club` model that users optionally belong to, manageable via ActiveAdmin.

**Architecture:** A new `Club` model (name/location/instagram/logo) gets its own ActiveAdmin resource. `User` gains `name`/`age`/`level`/`hand` columns and an optional `belongs_to :club`, plus two serialization methods (`dashboard_profile_json`, `profile_json`) mirroring `CourseModule#as_dashboard_json`. Controllers swap `DashboardData::USER` for these, and three frontend files are updated to handle real (possibly null) data instead of an always-populated mock.

**Tech Stack:** Rails 8.1, PostgreSQL (uuid PKs), Active Storage (already installed from the course-module-documents feature), RSpec + FactoryBot, ActiveAdmin, Inertia + React/TypeScript.

## Global Constraints

- uuid primary keys via `gen_random_uuid()`, no explicit `default:` needed (`config/application.rb:45`).
- Enum syntax: `enum :name, { key: 0, ... }` (positional symbol + hash), matching `app/models/user.rb`'s existing `role` enum.
- Any model ActiveAdmin filters/searches needs `ransackable_attributes`/`ransackable_associations` class methods (Rails 7.1+ Ransack safelist) — see `app/models/user.rb` and `app/models/course_module.rb` for the existing pattern.
- ActiveAdmin enum filters must submit the enum's integer value, not its string key (documented in `app/admin/users.rb`'s existing `filter :role` comment) — not relevant to the new `level`/`hand` fields since they aren't filtered, only `club` needs a filter and it's a `belongs_to`, not an enum.
- Spec style: `RSpec.describe X, type: :model` / `type: :request`, FactoryBot via bare `create`/`build`, `sign_in` from `Devise::Test::IntegrationHelpers`.
- `name` becomes required on `User`, but 3 rows already exist in dev — the migration must backfill before adding the `NOT NULL` constraint (see Task 2).
- Full design context: `docs/superpowers/specs/2026-08-13-user-profile-and-clubs-design.md`.

---

### Task 1: `Club` model, migration, and ActiveAdmin resource

**Files:**
- Create: `db/migrate/<timestamp>_create_clubs.rb`
- Create: `app/models/club.rb`
- Create: `app/admin/clubs.rb`
- Create: `spec/factories/clubs.rb`
- Create: `spec/fixtures/files/logo.png`
- Test: `spec/models/club_spec.rb`
- Test: `spec/requests/admin/clubs_spec.rb`

**Interfaces:**
- Produces: `Club` model with `name` (string, unique, required), `location` (string, nullable), `instagram` (string, nullable), `has_one_attached :logo`, `#to_s` returning `name`. `Club.ransackable_attributes`/`ransackable_associations`. `/admin/clubs` CRUD routes plus a `remove_logo` member action. Later tasks (2, 5) use `Club.find_or_create_by!(name:)`, `Club.order(:name)`, and the `:club` factory.

- [ ] **Step 1: Generate and write the migration**

Run: `bin/rails generate migration CreateClubs`

Replace the generated file's body:
```ruby
class CreateClubs < ActiveRecord::Migration[8.1]
  def change
    create_table :clubs, id: :uuid do |t|
      t.string :name, null: false
      t.string :location
      t.string :instagram

      t.timestamps
    end

    add_index :clubs, :name, unique: true
  end
end
```

Run: `bin/rails db:migrate`
Expected: `CreateClubs` migrates with no errors.

- [ ] **Step 2: Write the fixture file and factory**

Run:
```bash
mkdir -p spec/fixtures/files
printf '\x89PNG\r\n\x1a\n test fixture' > spec/fixtures/files/logo.png
```

`spec/factories/clubs.rb`:
```ruby
FactoryBot.define do
  factory :club do
    sequence(:name) { |n| "Club #{n}" }
  end
end
```

- [ ] **Step 3: Write the failing model spec**

`spec/models/club_spec.rb`:
```ruby
require "rails_helper"

RSpec.describe Club, type: :model do
  it "is valid with a name" do
    expect(build(:club)).to be_valid
  end

  it "requires a name" do
    expect(build(:club, name: nil)).not_to be_valid
  end

  it "requires a unique name" do
    create(:club, name: "Padel Clube Lisboa")
    expect(build(:club, name: "Padel Clube Lisboa")).not_to be_valid
  end

  it "can have a logo attached" do
    club = create(:club)
    club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
    expect(club.logo).to be_attached
  end

  it "returns its name as a string representation" do
    expect(build(:club, name: "Padel Clube Lisboa").to_s).to eq("Padel Clube Lisboa")
  end
end
```

Run: `bundle exec rspec spec/models/club_spec.rb`
Expected: FAIL — `uninitialized constant Club`.

- [ ] **Step 4: Implement `Club`**

`app/models/club.rb`:
```ruby
class Club < ApplicationRecord
  has_one_attached :logo
  has_many :users, dependent: :nullify

  validates :name, presence: true, uniqueness: true

  def to_s
    name
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name location instagram created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
```

Run: `bundle exec rspec spec/models/club_spec.rb`
Expected: 5 examples, 0 failures.

- [ ] **Step 5: Write the failing admin spec**

`spec/requests/admin/clubs_spec.rb`:
```ruby
require "rails_helper"

RSpec.describe "Admin clubs management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists clubs" do
    create(:club, name: "Special Club")
    get "/admin/clubs"
    expect(response).to have_http_status(200)
    expect(response.body).to include("Special Club")
  end

  it "creates a club" do
    expect {
      post "/admin/clubs", params: { club: { name: "New Club", location: "Porto", instagram: "@newclub" } }
    }.to change(Club, :count).by(1)
  end

  it "updates a club" do
    target = create(:club, name: "Old Name")
    patch "/admin/clubs/#{target.id}", params: { club: { name: "New Name" } }
    expect(target.reload.name).to eq("New Name")
  end

  it "deletes a club" do
    target = create(:club)
    expect { delete "/admin/clubs/#{target.id}" }.to change(Club, :count).by(-1)
  end

  it "uploads a logo" do
    target = create(:club)
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/logo.png"), "image/png")

    patch "/admin/clubs/#{target.id}", params: { club: { logo: file } }

    expect(target.reload.logo).to be_attached
  end

  it "removes a logo" do
    target = create(:club)
    target.logo.attach(io: StringIO.new("logo"), filename: "logo.png", content_type: "image/png")

    delete "/admin/clubs/#{target.id}/remove_logo"

    expect(target.reload.logo).not_to be_attached
  end
end
```

Run: `bundle exec rspec spec/requests/admin/clubs_spec.rb`
Expected: FAIL — 404s on `/admin/clubs` (not registered yet).

- [ ] **Step 6: Register the ActiveAdmin resource**

`app/admin/clubs.rb`:
```ruby
ActiveAdmin.register Club do
  permit_params :name, :location, :instagram, :logo

  index do
    selectable_column
    column :name
    column :location
    column :instagram
    actions
  end

  filter :name

  member_action :remove_logo, method: :delete do
    resource.logo.purge
    redirect_to edit_admin_club_path(resource), notice: "Logo removed."
  end

  form do |f|
    f.inputs "Club Details" do
      f.input :name
      f.input :location
      f.input :instagram
    end

    f.inputs "Logo" do
      if f.object.logo.attached?
        para do
          text_node "Current logo: #{f.object.logo.filename}"
          text_node " — "
          text_node(link_to("Remove", remove_logo_admin_club_path(f.object),
                             method: :delete, data: { confirm: "Remove the logo?" }))
        end
      end
      f.input :logo, as: :file
    end

    f.actions
  end
end
```

Run: `bundle exec rspec spec/requests/admin/clubs_spec.rb`
Expected: 6 examples, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add db/migrate db/schema.rb app/models/club.rb app/admin/clubs.rb \
        spec/factories/clubs.rb spec/fixtures/files/logo.png \
        spec/models/club_spec.rb spec/requests/admin/clubs_spec.rb
git commit -m "Add Club model with ActiveAdmin management"
```

---

### Task 2: Real `User` profile columns

**Files:**
- Create: `db/migrate/<timestamp>_add_profile_fields_to_users.rb`
- Modify: `app/models/user.rb`
- Modify: `spec/factories/users.rb`
- Modify: `spec/models/user_spec.rb`
- Modify: `app/admin/users.rb`
- Modify: `spec/requests/admin/users_spec.rb`

**Interfaces:**
- Consumes: `Club` model and `:club` factory from Task 1.
- Produces: `User#name`, `#age`, `#level` (enum), `#hand` (enum), `#club` (`belongs_to`, optional). `User#initials`, `#member_since`, `#dashboard_profile_json` (`{name:, initials:, club:}`), `#profile_json` (`{name:, initials:, email:, role:, age:, level:, hand:, club:, memberSince:}`). Later tasks (3, 5) call these two methods and rely on exactly these key names.

- [ ] **Step 1: Generate and write the migration**

Run: `bin/rails generate migration AddProfileFieldsToUsers`

Replace the generated file's body:
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

Run: `bin/rails db:migrate`
Expected: migrates with no errors. The 3 existing seed users now have a placeholder `name` (their email's local part) — Task 5 overwrites these with real names.

- [ ] **Step 2: Update the user factory**

`spec/factories/users.rb`:
```ruby
FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:name) { |n| "User #{n}" }
    password { "password123" }
    role { :client }
  end
end
```

- [ ] **Step 3: Write the failing model spec additions**

Replace `spec/models/user_spec.rb`'s full contents:
```ruby
require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with an email, password, and role" do
    expect(build(:user)).to be_valid
  end

  it "requires an email" do
    expect(build(:user, email: nil)).not_to be_valid
  end

  it "requires a unique email" do
    create(:user, email: "duplicate@example.com")
    expect(build(:user, email: "duplicate@example.com")).not_to be_valid
  end

  it "requires a name" do
    expect(build(:user, name: nil)).not_to be_valid
  end

  it "defines the expected role values" do
    expect(User.roles.keys).to match_array(%w[admin sales client])
  end

  it "defines the expected level values" do
    expect(User.levels.keys).to match_array(%w[beginner intermediate advanced])
  end

  it "defines the expected hand values" do
    expect(User.hands.keys).to match_array(%w[left right])
  end

  it "authenticates with the correct password" do
    user = create(:user, password: "password123")
    expect(user.valid_password?("password123")).to be true
  end

  it "does not require a club" do
    expect(build(:user, club: nil)).to be_valid
  end

  it "nullifies club_id when its club is destroyed" do
    club = create(:club)
    user = create(:user, club: club)

    club.destroy

    expect(user.reload.club_id).to be_nil
  end

  describe "#initials" do
    it "returns the first letter of the first two words" do
      expect(build(:user, name: "Miguel Santos").initials).to eq("MS")
    end

    it "returns a single letter for a one-word name" do
      expect(build(:user, name: "Admin").initials).to eq("A")
    end
  end

  describe "#member_since" do
    it "formats created_at as an abbreviated month and year" do
      user = create(:user)
      user.update_column(:created_at, Time.zone.local(2026, 3, 15))
      expect(user.member_since).to eq("Mar 2026")
    end
  end

  describe "#dashboard_profile_json" do
    it "returns name, initials, and the club's name" do
      club = create(:club, name: "Padel Clube Lisboa")
      user = build(:user, name: "Miguel Santos", club: club)

      expect(user.dashboard_profile_json).to eq(name: "Miguel Santos", initials: "MS", club: "Padel Clube Lisboa")
    end

    it "returns a nil club when the user has none" do
      user = build(:user, name: "Miguel Santos", club: nil)
      expect(user.dashboard_profile_json).to include(club: nil)
    end
  end

  describe "#profile_json" do
    it "includes level and hand capitalized" do
      user = build(:user, level: :beginner, hand: :right)
      expect(user.profile_json).to include(level: "Beginner", hand: "Right")
    end

    it "returns nil for level and hand when unset" do
      user = build(:user, level: nil, hand: nil)
      expect(user.profile_json).to include(level: nil, hand: nil)
    end
  end
end
```

Run: `bundle exec rspec spec/models/user_spec.rb`
Expected: FAIL — `NoMethodError: undefined method 'initials'` (and similar for the other new methods/columns).

- [ ] **Step 4: Update the `User` model**

Replace `app/models/user.rb`'s full contents:
```ruby
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, sales: 1, client: 2 }
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }
  enum :hand, { left: 0, right: 1 }

  belongs_to :club, optional: true
  has_many :user_module_progresses, dependent: :destroy

  validates :name, presence: true

  def initials
    name.to_s.split.first(2).map { |word| word[0] }.join.upcase
  end

  def member_since
    created_at.strftime("%b %Y")
  end

  def dashboard_profile_json
    { name: name, initials: initials, club: club&.name }
  end

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

  def self.ransackable_attributes(_auth_object = nil)
    %w[email role created_at club_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
```

Run: `bundle exec rspec spec/models/user_spec.rb`
Expected: 16 examples, 0 failures.

- [ ] **Step 5: Update the ActiveAdmin `User` form**

Replace `app/admin/users.rb`'s full contents:
```ruby
ActiveAdmin.register User do
  permit_params :email, :role, :password, :password_confirmation, :name, :age, :level, :hand, :club_id

  index do
    selectable_column
    column :email
    column :name
    column :role
    column :club
    column :created_at
    actions
  end

  filter :email
  # Ransack's role_eq casts the submitted value with a naive #to_i (not
  # Rails' enum-aware type casting), so a string key like "sales" silently
  # becomes 0 and matches "admin" instead. Submit the enum's real integer
  # values instead of its string keys to avoid that.
  filter :role, as: :select, collection: -> { User.roles.to_a }
  filter :club, as: :select, collection: -> { Club.order(:name) }

  form do |f|
    f.inputs "User Details" do
      f.input :email
      f.input :name
      f.input :role, as: :select, collection: User.roles.keys
      f.input :age
      f.input :level, as: :select, collection: User.levels.keys, include_blank: true
      f.input :hand, as: :select, collection: User.hands.keys, include_blank: true
      f.input :club, as: :select, collection: Club.order(:name), include_blank: true
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end

  controller do
    def update_resource(object, attributes)
      params = attributes.first
      params = params.except(:password, :password_confirmation) if params[:password].blank?
      object.update(params)
    end
  end
end
```

- [ ] **Step 6: Write the failing admin request spec addition**

In `spec/requests/admin/users_spec.rb`, change the `"creates a user with a password"` test's params to include `name:` (required now):
```ruby
  it "creates a user with a password" do
    expect {
      post "/admin/users", params: {
        user: {
          email: "new@example.com", role: "client", name: "New User",
          password: "password123", password_confirmation: "password123"
        }
      }
    }.to change(User, :count).by(1)

    expect(User.find_by(email: "new@example.com")).to be_present
  end
```

Then add a new test at the end of the file, before the final `end`:
```ruby
  it "assigns a user to a club" do
    club = create(:club, name: "Padel Clube Lisboa")
    target = create(:user)

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: target.role, club_id: club.id, password: "", password_confirmation: "" }
    }

    expect(target.reload.club).to eq(club)
  end
```

Run: `bundle exec rspec spec/requests/admin/users_spec.rb`
Expected: FAIL on `"creates a user with a password"` before the params fix is applied (missing `name`), PASS after.

- [ ] **Step 7: Run it, verify all pass**

Run: `bundle exec rspec spec/requests/admin/users_spec.rb`
Expected: 7 examples, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add db/migrate db/schema.rb app/models/user.rb app/admin/users.rb \
        spec/factories/users.rb spec/models/user_spec.rb spec/requests/admin/users_spec.rb
git commit -m "Add real profile fields (name/age/level/hand) and club membership to User"
```

---

### Task 3: Wire controllers to real user data

**Files:**
- Modify: `app/controllers/dashboard_controller.rb:4-6`
- Modify: `app/controllers/profile_controller.rb`
- Modify: `app/models/dashboard_data.rb:96-99` (delete the `USER` constant)
- Modify: `spec/requests/dashboard_spec.rb`
- Modify: `spec/requests/profile_spec.rb`

**Interfaces:**
- Consumes: `User#dashboard_profile_json`, `User#profile_json` from Task 2.
- Produces: no new interfaces; `dashboardUser` and `profile` Inertia props keep the same shape as before, now populated from the real signed-in user.

- [ ] **Step 1: Rewrite `spec/requests/dashboard_spec.rb`**

Replace its full contents:
```ruby
require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  it "redirects an unauthenticated visitor to the login page" do
    get "/dashboard"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the real dashboard home for an authenticated user" do
    user = create(:user, name: "Ana Costa")
    create(:course_module, slug: "module-1", title: "Real Module")
    sign_in user

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Dashboard/Home"')
    expect(response.body).to include("Real Module")
    expect(response.body).to include("Ana Costa")
  end
end
```

- [ ] **Step 2: Rewrite `spec/requests/profile_spec.rb`**

Replace its full contents:
```ruby
require "rails_helper"

RSpec.describe "Profile", type: :request do
  let(:user) { create(:user, email: "test@example.com", name: "Ana Costa") }

  before { sign_in user }

  it "renders the profile page with the real signed-in user's data" do
    get "/dashboard/profile"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Profile/Show"')
    expect(response.body).to include("test@example.com")
    expect(response.body).to include(user.role)
    expect(response.body).to include("Ana Costa")
  end

  it "shows the user's club name when they belong to one" do
    club = Club.create!(name: "Padel Clube Lisboa")
    user.update!(club: club)

    get "/dashboard/profile"

    expect(response.body).to include("Padel Clube Lisboa")
  end
end
```

- [ ] **Step 3: Run both specs, verify they fail**

Run: `bundle exec rspec spec/requests/dashboard_spec.rb spec/requests/profile_spec.rb`
Expected: FAIL — the response body still contains "Miguel Santos" (from `DashboardData::USER`), not "Ana Costa" or the real club.

- [ ] **Step 4: Update `DashboardController`**

In `app/controllers/dashboard_controller.rb`, replace lines 4-6:
```ruby
  inertia_share do
    { dashboardUser: current_user.dashboard_profile_json }
  end
```

- [ ] **Step 5: Update `ProfileController`**

Replace `app/controllers/profile_controller.rb`'s full contents:
```ruby
class ProfileController < DashboardController
  def index
    render inertia: "Profile/Show", props: { profile: current_user.profile_json }
  end
end
```

- [ ] **Step 6: Delete the `USER` constant**

In `app/models/dashboard_data.rb`, delete lines 96-99 (the `USER = { ... }.freeze` block, including its blank line before `COURSE_STATS`).

- [ ] **Step 7: Run both specs, verify they pass**

Run: `bundle exec rspec spec/requests/dashboard_spec.rb spec/requests/profile_spec.rb`
Expected: 3 examples, 0 failures.

- [ ] **Step 8: Run the full suite**

Run: `bundle exec rspec`
Expected: 0 failures.

- [ ] **Step 9: Commit**

```bash
git add app/controllers/dashboard_controller.rb app/controllers/profile_controller.rb app/models/dashboard_data.rb \
        spec/requests/dashboard_spec.rb spec/requests/profile_spec.rb
git commit -m "Serve real user profile data instead of the DashboardData::USER mock"
```

---

### Task 4: Frontend — handle real (possibly null) profile data

**Files:**
- Modify: `app/frontend/types/dashboard-data.ts`
- Modify: `app/frontend/pages/Profile/Show.tsx`
- Modify: `app/frontend/components/shell.tsx:44-52`

**Interfaces:**
- Consumes: `dashboardUser: { name, initials, club: string | null }`, `profile: { name, initials, email, role, age: number | null, level: string | null, hand: string | null, club: string | null, memberSince }` — both from Task 3's controllers.

- [ ] **Step 1: Update `DashboardUser`'s type**

In `app/frontend/types/dashboard-data.ts`, change:
```diff
 export interface DashboardUser {
   name: string
   initials: string
-  club: string
+  club: string | null
 }
```

- [ ] **Step 2: Update `Profile/Show.tsx`**

Replace its full contents:
```tsx
import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'

interface Profile {
  name: string
  initials: string
  email: string
  role: string
  age: number | null
  level: string | null
  hand: string | null
  club: string | null
  memberSince: string
}

interface Props {
  profile: Profile
}

function Show() {
  const { profile } = usePage<Props>().props

  const rows: Array<[string, string]> = [
    ['Email', profile.email],
    ['Role', profile.role],
    ['Age', profile.age ? String(profile.age) : '—'],
    ['Level', profile.level ?? '—'],
    ['Hand', profile.hand ?? '—'],
    ['Club', profile.club ?? '—'],
  ]

  function handleLogout() {
    router.delete('/users/sign_out')
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-ink text-xl font-bold text-paper lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-[21px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">{profile.name}</h1>
            <div className="mt-0.5 text-[13px] text-muted lg:text-sm">
              {profile.club ? `${profile.club} · ` : ''}Member since {profile.memberSince}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0">
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

- [ ] **Step 3: Update `shell.tsx`'s `Sidebar`**

In `app/frontend/components/shell.tsx`, replace lines 44-52:
```tsx
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {dashboardUser.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{dashboardUser.name}</div>
          {dashboardUser.club && <div className="text-[11px] text-muted">{dashboardUser.club}</div>}
        </div>
      </div>
```

- [ ] **Step 4: Type-check and lint**

Run:
```bash
npx tsc -p tsconfig.app.json --noEmit
npx biome check app/frontend/types/dashboard-data.ts app/frontend/pages/Profile/Show.tsx app/frontend/components/shell.tsx
```
Expected: no new errors from these 3 files (pre-existing `PageProps` errors in unrelated files aren't from this change); biome passes clean.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/types/dashboard-data.ts app/frontend/pages/Profile/Show.tsx app/frontend/components/shell.tsx
git commit -m "Handle real (possibly null) profile data on the frontend"
```

---

### Task 5: Seed a real club and real user profiles

**Files:**
- Modify: `db/seeds.rb`
- Modify: `spec/tasks/seeds_spec.rb`

**Interfaces:**
- Consumes: `Club.find_or_create_by!`, `User` columns/associations from Tasks 1-2.
- Produces: 1 seeded `Club`, 3 seed `User`s with real `name` (and `client@example.com` additionally with `age`/`level`/`hand`/`club`).

- [ ] **Step 1: Write the failing seeds spec additions**

Append to `spec/tasks/seeds_spec.rb`, inside the existing `RSpec.describe "db/seeds.rb" do ... end` block (after the last existing `it` block, before the closing `end`):
```ruby
  it "creates one club matching today's hardcoded values" do
    expect(Club.count).to eq(1)
    expect(Club.first.name).to eq("Padel Clube Lisboa")
  end

  it "gives the client user a real name, age, level, hand, and club" do
    client = User.find_by(email: "client@example.com")

    expect(client.name).to eq("Miguel Santos")
    expect(client.age).to eq(34)
    expect(client.level).to eq("beginner")
    expect(client.hand).to eq("right")
    expect(client.club.name).to eq("Padel Clube Lisboa")
  end
```

Run: `bundle exec rspec spec/tasks/seeds_spec.rb`
Expected: FAIL — `Club.count` is 0, and `client.name` is the placeholder backfilled from the email (`"client"`), not `"Miguel Santos"`.

- [ ] **Step 2: Update `db/seeds.rb`**

Replace its full contents:
```ruby
club = Club.find_or_create_by!(name: "Padel Clube Lisboa") do |c|
  c.location = "Lisboa, Portugal"
end

User.find_or_create_by!(email: "admin@example.com") do |user|
  user.password = "password123"
  user.role = :admin
  user.name = "Admin User"
end

User.find_or_create_by!(email: "sales@example.com") do |user|
  user.password = "password123"
  user.role = :sales
  user.name = "Sales User"
end

User.find_or_create_by!(email: "client@example.com") do |user|
  user.password = "password123"
  user.role = :client
  user.name = "Miguel Santos"
  user.age = 34
  user.level = :beginner
  user.hand = :right
  user.club = club
end

course_modules_data = JSON.parse(Rails.root.join("docs/courses/beginner.json").read)

course_modules_data.each_with_index do |data, index|
  CourseModule.find_or_create_by!(slug: data["externalId"]) do |course_module|
    course_module.level = :beginner
    course_module.position = index + 1
    course_module.title = data["title"]["pt"]
    course_module.description = data["description"]["pt"]
    course_module.topics = data["topics"]["pt"]
    course_module.duration = data["duration"]["pt"]
    course_module.content = data["content"]["pt"]
  end
end

progress_by_slug = {
  "module-1" => { status: :done, progress: 100 },
  "module-2" => { status: :done, progress: 100 },
  "module-3" => { status: :current, progress: 40 },
  "module-4" => { status: :locked, progress: 0 },
  "module-5" => { status: :locked, progress: 0 },
  "module-6" => { status: :locked, progress: 0 },
  "module-7" => { status: :locked, progress: 0 },
  "module-8" => { status: :locked, progress: 0 }
}.freeze

User.find_each do |user|
  progress_by_slug.each do |slug, attrs|
    course_module = CourseModule.find_by!(slug: slug)
    UserModuleProgress.find_or_create_by!(user: user, course_module: course_module) do |progress|
      progress.status = attrs[:status]
      progress.progress = attrs[:progress]
    end
  end
end
```

- [ ] **Step 3: Run it, verify it passes**

Run: `bundle exec rspec spec/tasks/seeds_spec.rb`
Expected: 4 examples, 0 failures.

- [ ] **Step 4: Run the real seed against the dev database**

Run: `bin/rails db:seed`
Expected: completes with no errors. Then: `bin/rails runner 'puts Club.count; puts User.find_by(email: "client@example.com").name'` — expect `1` and `Miguel Santos`.

- [ ] **Step 5: Run the full suite one more time**

Run: `bundle exec rspec`
Expected: 0 failures.

- [ ] **Step 6: Manually verify in the browser**

With the dev server running, sign in as `client@example.com` / `password123` and confirm:
- The sidebar shows "Miguel Santos" / "Padel Clube Lisboa" (unchanged from before, now real data).
- `/dashboard/profile` shows Level "Beginner" and Hand "Right" rows that didn't exist before.
- Sign in as `admin@example.com` instead and confirm the sidebar shows no club line, and `/dashboard/profile` shows "—" for Age/Level/Hand/Club.
- In `/admin/users`, edit a user and assign/change their club via the new dropdown; in `/admin/clubs`, create a club and upload/remove a logo.

- [ ] **Step 7: Commit**

```bash
git add db/seeds.rb spec/tasks/seeds_spec.rb
git commit -m "Seed a real club and real profile data for the demo users"
```
