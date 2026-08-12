# ActiveAdmin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins (`User#role == :admin`) sign into an ActiveAdmin panel at `/admin` and manage users (search, view, edit, create, delete), using their existing app credentials — no separate admin-user system.

**Architecture:** `activeadmin` gem mounted at `/admin`, gated by a custom `authenticate_admin!` check that reuses Devise's existing `User`/`current_user`. **Revised during execution:** the installed ActiveAdmin 3.5.2 (unlike its unreleased `master` branch, which Task 1's original research was mistakenly based on) still ships Sprockets/jQuery-based assets, not importmap/Tailwind — `importmap-rails`/`cssbundling-rails` were never actually used. Instead, ActiveAdmin's JS/CSS were compiled *once* via a temporary `sprockets-rails`+`sassc-rails` detour, and the static output was committed to `app/assets/builds/active_admin.{css,js}` for Propshaft to serve going forward, with no ongoing jQuery/Sprockets dependency. See Task 1 for the corrected steps actually taken.

**Tech Stack:** Rails 8.1, Ruby 3.3.12, Devise 5, ActiveAdmin 3.5.2, RSpec + FactoryBot.

## Global Constraints

- Reuse the existing `User` model and its `role` enum (`admin`/`sales`/`client`) — no separate `AdminUser` model, no new Devise modules, no schema changes to `users` beyond what already exists.
- No authorization gem (CanCanCan/Pundit) — the only check needed is "is this user an admin."
- Content models (course modules, exercises, quizzes, plans) are out of scope — nothing from `app/models/dashboard_data.rb` gets touched or registered in ActiveAdmin.
- No CI/deploy/Dockerfile changes — this repo has none yet.
- Tests are RSpec request specs using the existing `create(:user, ...)` factory and `sign_in` (`Devise::Test::IntegrationHelpers`, already configured for `type: :request` in `spec/rails_helper.rb`).

---

### Task 1: Install ActiveAdmin and gate it to admins only — DONE (commit `0084517`)

> **Revised during execution.** The steps originally written here (`importmap-rails` + Tailwind-based `cssbundling-rails`) were based on ActiveAdmin's unreleased `master` branch, not the actually-installed **3.5.2**, which still depends on `jquery-rails` and generates Sprockets/SCSS assets. What follows is what was *actually* done, kept for the historical record — see the corrected **Architecture** note at the top of this doc.

**Files actually touched:**
- Modified: `Gemfile`, `Gemfile.lock` (added `activeadmin` only — `importmap-rails`/`cssbundling-rails` were never kept)
- Modified: `config/routes.rb` (`ActiveAdmin.routes(self)`, inserted right after `Rails.application.routes.draw do` — not "near the end" as originally guessed)
- Created: `config/initializers/active_admin.rb`, `app/admin/dashboard.rb`
- Created: `app/assets/builds/active_admin.css`, `app/assets/builds/active_admin.js` — **committed**, not gitignored (see below)
- Created: `spec/requests/admin_spec.rb`

**Interfaces:**
- Produces: `authenticate_admin!` — an instance method on `ActiveAdmin::BaseController` that later tasks (and ActiveAdmin itself, via `config.authentication_method`) rely on to gate every admin controller action.

- [x] **Step 1: Add the gem**

Added only `gem "activeadmin"` to `Gemfile` (not `importmap-rails`/`cssbundling-rails` — irrelevant to the installed version), then `bundle install`. Pulled in `arbre`, `formtastic`, `ransack`, `inherited_resources`, `kaminari`, and **`jquery-rails`** — that last one was the first sign the master-branch research didn't match reality.

- [x] **Step 2: Run the ActiveAdmin install generator against the existing `User` model**

```bash
bin/rails generate active_admin:install User --skip-users --skip-comments
```

Reasoning for the flags was correct and held up: `--skip-users` avoids re-running Devise's generator against the already-Devise-enabled `User`; `--skip-comments` skips the unneeded comments feature/migration.

Actual output: `create config/initializers/active_admin.rb`, `create app/admin/dashboard.rb`, `route ActiveAdmin.routes(self)`, plus (via the nested `active_admin:assets` generator) `create app/assets/javascripts/active_admin.js` (a Sprockets `//= require active_admin/base` directive) and `create app/assets/stylesheets/active_admin.scss` — **not** `active_admin.css` / `tailwind-active_admin.config.js` as originally expected. No migration created, confirmed via `git status`.

- [x] **Step 3 (revised): Compile ActiveAdmin's real assets once via a temporary Sprockets detour**

Propshaft can't process either generated file (`.scss` needs a Sass compiler; the `//= require` directive is Sprockets-only), and the installed 3.5.2 needs actual jQuery/jQuery UI JS to function, not just CSS. Rather than wire a permanent second pipeline, compiled once and kept only the static output:

```bash
# Temporarily, in Gemfile:
#   gem "sprockets-rails"
#   gem "sassc-rails"
bundle install

# Sprockets requires a manifest declaring what to precompile:
#   app/assets/config/manifest.js:
#     //= link active_admin.js
#     //= link active_admin.css

RAILS_ENV=development bin/rails assets:precompile
```

This produced real compiled output in `public/assets/`: `active_admin-<hash>.css` (161KB — normalize.css + all of ActiveAdmin's real styles) and `active_admin-<hash>.js` (652KB — jQuery 3.7.1 + jQuery UI + ActiveAdmin's own JS, fully bundled). Copied both to stable, unhashed names:

```bash
cp public/assets/active_admin-<hash>.css app/assets/builds/active_admin.css
cp public/assets/active_admin-<hash>.js  app/assets/builds/active_admin.js
```

Removed the now-redundant uncompiled sources (`app/assets/javascripts/active_admin.js`, `app/assets/stylesheets/active_admin.scss`) — Propshaft would otherwise see two files both logically named `active_admin.js`/`active_admin.css` (one real, one an unprocessable stub), which is ambiguous. Then removed the temporary gems and `app/assets/config/manifest.js`, ran `bundle install` again, and deleted `public/assets/` (Sprockets' scratch output, already gitignored, not needed anymore).

**`app/assets/builds/active_admin.{css,js}` are committed to git**, unlike a typical `cssbundling-rails` setup — there's no watcher process regenerating them, so if they were gitignored a fresh checkout would 500 on `/admin`. They only need regenerating (repeat this step) if ActiveAdmin itself is upgraded.

ActiveAdmin's default asset registration already points at exactly these logical names (`ActiveAdmin.application.stylesheets`/`.javascripts` default to `"active_admin.css"`/`"active_admin.js"`, rendered via plain `stylesheet_link_tag`/`javascript_include_tag` when `use_webpacker` is false, which it is by default) — so no changes were needed to `config/initializers/active_admin.rb` for asset *paths*, only for authentication (Step 4).

- [x] **Step 4: Wire authentication — edit `config/initializers/active_admin.rb`**

Uncommented and fixed:

```ruby
  config.authentication_method = :authenticate_admin!
  config.current_user_method = :current_user
```

(`config.logout_link_path = :destroy_user_session_path` was already correct as generated, not commented out.)

At the end of the file:

```ruby
Rails.application.config.to_prepare do
  ActiveAdmin::BaseController.class_eval do
    def authenticate_admin!
      authenticate_user!
      redirect_to root_path, alert: "You are not authorized to access this page." unless current_user.admin?
    end
  end
end
```

Two things the original plan got wrong here: (1) this must be defined on `ActiveAdmin::BaseController`, not `ApplicationController` — AA's controllers inherit from `InheritedResources::Base`, so a method on `ApplicationController` alone would never be found by `config.authentication_method`'s `send`. `authenticate_user!`/`current_user` are found either way because Devise patches those onto `ActionController::Base` globally. (2) `class_eval`-ing `ActiveAdmin::BaseController` directly at initializer load time raised `NameError: uninitialized constant InheritedResources::Base` — some of AA's dependencies aren't safely loadable that early in boot. Wrapping it in `Rails.application.config.to_prepare` (runs after all initializers, and again on each reload in development) fixed it.

- [x] **Step 5: Write the request spec and confirm it passes**

`spec/requests/admin_spec.rb` — exactly as originally planned (anonymous → redirected to login; non-admin → redirected to root with the alert; admin → 200). Also spot-checked (throwaway spec, not kept) that the response body actually contains resolved `<link>`/`<script>` tags pointing at digested `active_admin-*.css`/`.js` URLs, confirming Propshaft is serving the committed static bundle correctly.

```bash
bundle exec rspec spec/requests/admin_spec.rb   # 3 examples, 0 failures
bundle exec rspec                                # 31 examples, 0 failures (28 pre-existing + 3 new)
```

- [x] **Step 6: Commit**

```bash
git add Gemfile Gemfile.lock config/initializers/active_admin.rb config/routes.rb \
  app/admin/dashboard.rb app/assets/builds/active_admin.css app/assets/builds/active_admin.js \
  package-lock.json spec/requests/admin_spec.rb
git commit -m "Install ActiveAdmin, gated to admin users only"
```

(`package-lock.json` picked up an unrelated cosmetic diff — npm inferred the lockfile's `name` field from the directory name since `package.json` has none set — harmless, left as-is.)

---

### Task 2: Build the User admin resource — DONE (commit pending)

> **One correction found via TDD:** Ransack's `role_eq` casts a submitted value with a naive `#to_i`, not Rails' enum-aware type casting — `role_eq: "sales"` silently became `0` and matched `admin` instead of raising or matching `sales`. Fixed by having the filter's `<select>` submit the enum's real integer values (`User.roles.to_a`) rather than its string keys (`User.roles.keys`). The **form** doesn't have this problem — `f.input :role` submits through the model's `role=` setter on create/update, which *does* use Rails' proper enum casting. Only Ransack's filter path is affected. See Steps 4-5 below for the corrected code.

**Files:**
- Create: `app/admin/users.rb`
- Modify: `app/models/user.rb`
- Create: `spec/requests/admin/users_spec.rb`

**Interfaces:**
- Consumes: `authenticate_admin!` from Task 1 (already wired globally — no changes needed here, just exercised by the new specs).
- Produces: `User.ransackable_attributes` / `User.ransackable_associations` — later admin resources (none planned yet) would need their own equivalents; this task's methods are User-specific, not reusable.

- [x] **Step 1: Allowlist which `User` columns ActiveAdmin/Ransack may filter and sort on**

Ransack 4 (a dependency of ActiveAdmin) denies filtering on any model by default, as a security measure, until the model explicitly allowlists safe columns — otherwise `/admin/users` raises as soon as ActiveAdmin tries to build its filter sidebar. The naive fix (`authorizable_ransackable_attributes`, which ActiveAdmin's own docs sometimes show) allowlists **every** column, including `encrypted_password` — wrong for a model with sensitive columns. Explicitly list only the safe ones instead.

Edit `app/models/user.rb`:

```ruby
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, sales: 1, client: 2 }

  def self.ransackable_attributes(_auth_object = nil)
    %w[email role created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
```

- [x] **Step 2: Write the failing request specs**

Create `spec/requests/admin/users_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Admin users management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists users" do
    create(:user, email: "someone@example.com")
    get "/admin/users"
    expect(response).to have_http_status(200)
    expect(response.body).to include("someone@example.com")
  end

  it "filters users by role" do
    create(:user, email: "sales-person@example.com", role: :sales)
    # The rendered filter <select> submits the enum's integer value (see
    # app/admin/users.rb) -- not the string key, which Ransack's role_eq
    # would silently miscast via a naive #to_i.
    get "/admin/users", params: { q: { role_eq: User.roles["sales"] } }
    expect(response).to have_http_status(200)
    expect(response.body).to include("sales-person@example.com")
  end

  it "creates a user with a password" do
    expect {
      post "/admin/users", params: {
        user: { email: "new@example.com", role: "client", password: "password123", password_confirmation: "password123" }
      }
    }.to change(User, :count).by(1)

    expect(User.find_by(email: "new@example.com")).to be_present
  end

  it "updates a user's role without requiring a password" do
    target = create(:user, role: :client)

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "sales", password: "", password_confirmation: "" }
    }

    expect(target.reload.role).to eq("sales")
  end

  it "leaves a user's existing password valid when editing without touching it" do
    target = create(:user, email: "keep-pass@example.com", password: "originalpass1")

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "client", password: "", password_confirmation: "" }
    }

    expect(target.reload.valid_password?("originalpass1")).to be true
  end

  it "deletes a user" do
    target = create(:user)
    expect { delete "/admin/users/#{target.id}" }.to change(User, :count).by(-1)
  end
end
```

- [x] **Step 3: Run the specs and confirm they fail**

```bash
bundle exec rspec spec/requests/admin/users_spec.rb
```

Actual: 404s (not routing exceptions, but same root cause) — `app/admin/users.rb` doesn't exist yet, so ActiveAdmin hasn't registered any routes for it.

- [x] **Step 4: Create the User admin resource**

Create `app/admin/users.rb` (the `filter :role` line differs from the original draft — see the correction note above):

```ruby
ActiveAdmin.register User do
  permit_params :email, :role, :password, :password_confirmation

  index do
    selectable_column
    column :email
    column :role
    column :created_at
    actions
  end

  filter :email
  # Ransack's role_eq casts the submitted value with a naive #to_i (not
  # Rails' enum-aware type casting), so a string key like "sales" silently
  # becomes 0 and matches "admin" instead. Submit the enum's real integer
  # values instead of its string keys to avoid that.
  filter :role, as: :select, collection: -> { User.roles.to_a }

  form do |f|
    f.inputs "User Details" do
      f.input :email
      f.input :role, as: :select, collection: User.roles.keys
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

(First pass used `User.roles.keys` for the filter, matching the form. That passed 5/6 specs but silently returned the wrong user for the role filter — caught by the "filters users by role" spec actually asserting on *which* user came back, not just a 200. Worth remembering: a filter test that only checks the status code wouldn't have caught this.)

- [x] **Step 5: Run the specs and confirm they pass**

```bash
bundle exec rspec spec/requests/admin/users_spec.rb
```

Result: `6 examples, 0 failures`.

- [x] **Step 6: Run the full suite to check for regressions**

```bash
bundle exec rspec
```

Result: `37 examples, 0 failures` (31 from Task 1 + 6 new).

- [x] **Step 7: Commit**

```bash
git add app/admin/users.rb app/models/user.rb spec/requests/admin/users_spec.rb
git commit -m "Add User ActiveAdmin resource with search, edit, create, delete"
```

---

### Task 3: `rails admin:create` task for production/staging admin accounts

**Files:**
- Create: `lib/tasks/admin.rake`
- Create: `spec/tasks/admin_create_spec.rb`

**Interfaces:**
- Produces: `rails admin:create EMAIL=... PASSWORD=...` — a standalone CLI entry point, not consumed by any other task in this plan.

`db/seeds.rb` already creates `admin@example.com` for local dev (alongside fake sales/client accounts) — this task is for staging/production, where you won't run `db:seed`.

- [ ] **Step 1: Write the failing specs**

Create `spec/tasks/admin_create_spec.rb`:

```ruby
require "rails_helper"
require "rake"

RSpec.describe "admin:create rake task" do
  before(:all) do
    Rails.application.load_tasks
  end

  before do
    Rake::Task["admin:create"].reenable
  end

  around do |example|
    original_email = ENV["EMAIL"]
    original_password = ENV["PASSWORD"]
    example.run
    ENV["EMAIL"] = original_email
    ENV["PASSWORD"] = original_password
  end

  it "creates a new admin user" do
    ENV["EMAIL"] = "newadmin@example.com"
    ENV["PASSWORD"] = "password123"

    expect { Rake::Task["admin:create"].invoke }.to change(User, :count).by(1)

    user = User.find_by(email: "newadmin@example.com")
    expect(user.role).to eq("admin")
  end

  it "promotes an existing user to admin instead of creating a duplicate" do
    existing = create(:user, email: "promote@example.com", role: :client)
    ENV["EMAIL"] = "promote@example.com"
    ENV["PASSWORD"] = "password123"

    expect { Rake::Task["admin:create"].invoke }.not_to change(User, :count)

    expect(existing.reload.role).to eq("admin")
  end

  it "exits without raising when EMAIL or PASSWORD is missing" do
    ENV["EMAIL"] = "bad@example.com"
    ENV["PASSWORD"] = ""

    expect { Rake::Task["admin:create"].invoke }.to raise_error(SystemExit)
  end
end
```

- [ ] **Step 2: Run the specs and confirm they fail**

```bash
bundle exec rspec spec/tasks/admin_create_spec.rb
```

Expected: `Don't know how to build task 'admin:create'` (the task doesn't exist yet).

- [ ] **Step 3: Create the rake task**

Create `lib/tasks/admin.rake`:

```ruby
namespace :admin do
  desc "Create or promote an admin user. Usage: rails admin:create EMAIL=admin@example.com PASSWORD=secret123"
  task create: :environment do
    email = ENV["EMAIL"]
    password = ENV["PASSWORD"]

    if email.blank? || password.blank?
      abort "Usage: rails admin:create EMAIL=admin@example.com PASSWORD=secret123"
    end

    user = User.find_or_initialize_by(email: email)
    user.password = password
    user.role = :admin

    if user.save
      puts "Admin user '#{email}' #{user.previously_new_record? ? "created" : "updated"}."
    else
      abort "Failed to save admin user: #{user.errors.full_messages.join(', ')}"
    end
  end
end
```

- [ ] **Step 4: Run the specs and confirm they pass**

```bash
bundle exec rspec spec/tasks/admin_create_spec.rb
```

Expected: `3 examples, 0 failures`.

- [ ] **Step 5: Run the full suite one last time**

```bash
bundle exec rspec
```

Expected: all examples pass.

- [ ] **Step 6: Commit**

```bash
git add lib/tasks/admin.rake spec/tasks/admin_create_spec.rb
git commit -m "Add rails admin:create task for staging/production admin accounts"
```
