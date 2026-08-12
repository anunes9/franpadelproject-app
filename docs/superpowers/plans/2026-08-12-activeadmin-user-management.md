# ActiveAdmin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins (`User#role == :admin`) sign into an ActiveAdmin panel at `/admin` and manage users (search, view, edit, create, delete), using their existing app credentials — no separate admin-user system.

**Architecture:** `activeadmin` gem mounted at `/admin`, gated by a custom `authenticate_admin!` check that reuses Devise's existing `User`/`current_user`. ActiveAdmin 3.5's JS ships via `importmap-rails`; its Tailwind-based CSS ships via `cssbundling-rails`, built independently of this app's existing Vite pipeline (which stays untouched).

**Tech Stack:** Rails 8.1, Ruby 3.3.12, Devise 5, ActiveAdmin 3.5, importmap-rails, cssbundling-rails, RSpec + FactoryBot.

## Global Constraints

- Reuse the existing `User` model and its `role` enum (`admin`/`sales`/`client`) — no separate `AdminUser` model, no new Devise modules, no schema changes to `users` beyond what already exists.
- No authorization gem (CanCanCan/Pundit) — the only check needed is "is this user an admin."
- Content models (course modules, exercises, quizzes, plans) are out of scope — nothing from `app/models/dashboard_data.rb` gets touched or registered in ActiveAdmin.
- No CI/deploy/Dockerfile changes — this repo has none yet.
- Tests are RSpec request specs using the existing `create(:user, ...)` factory and `sign_in` (`Devise::Test::IntegrationHelpers`, already configured for `type: :request` in `spec/rails_helper.rb`).

---

### Task 1: Install ActiveAdmin and gate it to admins only

**Files:**
- Modify: `Gemfile`, `Gemfile.lock` (via `bundle install`)
- Create (via generators): `config/initializers/active_admin.rb`, `app/admin/dashboard.rb`, `app/assets/stylesheets/active_admin.css`, `tailwind-active_admin.config.js`, `config/importmap.rb`, `app/javascript/application.js`, `app/assets/stylesheets/application.tailwind.css` (created then removed — see steps)
- Modify: `config/routes.rb`, `package.json`, `Procfile.dev`, `.gitignore` (auto-updated by generators)
- Create: `spec/requests/admin_spec.rb`

**Interfaces:**
- Produces: `authenticate_admin!` — an instance method on `ActiveAdmin::BaseController` that later tasks (and ActiveAdmin itself, via `config.authentication_method`) rely on to gate every admin controller action.

- [ ] **Step 1: Add the three gems**

Edit `Gemfile`, after the `gem "vite_rails", "~> 3.11"` line (currently line 50), add:

```ruby

# Admin panel for managing users [https://activeadmin.info]
gem "activeadmin"
# JS for Active Admin's UI, via ES module imports (no bundler needed) [https://github.com/rails/importmap-rails]
gem "importmap-rails"
# Builds Active Admin's Tailwind CSS bundle, independent of the app's Vite pipeline [https://github.com/rails/cssbundling-rails]
gem "cssbundling-rails"
```

Run:

```bash
bundle install
```

Expected: `Bundle complete!`, `Gemfile.lock` updated with `activeadmin`, `importmap-rails`, `cssbundling-rails`, and their dependencies (`arbre`, `formtastic`, `ransack`, `inherited_resources`, `kaminari`, etc.).

- [ ] **Step 2: Run the ActiveAdmin install generator against the existing `User` model**

```bash
bin/rails generate active_admin:install User --skip-users --skip-comments
```

- `--skip-users` is required: without it, the generator re-runs Devise's own generator against `User`, which already has `database_authenticatable` and a matching migration — re-running it would generate a redundant/conflicting migration.
- `--skip-comments` skips ActiveAdmin's resource-commenting feature and its migration (not needed here).
- Passing `User` (instead of the default `AdminUser`) still makes the generator fill in the initializer with the right method names (`authenticate_user!`, `current_user`, `destroy_user_session_path`) — those lines are generated as comments because of `--skip-users`; Step 5 below edits them in.

Expected output includes: `create config/initializers/active_admin.rb`, `create app/admin/dashboard.rb`, `route ActiveAdmin.routes(self)` (appended near the end of `config/routes.rb`, before the closing `end`), `create app/assets/stylesheets/active_admin.css`, `create tailwind-active_admin.config.js`. No migration is created (confirm with `git status` — no new file under `db/migrate/`).

- [ ] **Step 3: Wire up the JS (importmap-rails)**

```bash
bin/rails importmap:install
```

Expected: creates `config/importmap.rb` and `app/javascript/application.js`. Nothing to wire manually — ActiveAdmin's own layout already calls `javascript_importmap_tags` itself, and this app's own layout (used by the Inertia/React pages) doesn't need it, since Inertia doesn't use import maps. No conflict with the existing Vite setup: importmap-rails uses `app/javascript`, Vite uses `app/frontend` (see `config/vite.json`).

- [ ] **Step 4: Wire up the CSS (cssbundling-rails), targeting ActiveAdmin's stylesheet**

```bash
bin/rails css:install:tailwind
```

This generates a default `app/assets/stylesheets/application.tailwind.css` and a `build:css` npm script pointing at it — not what we want, since this app's real frontend already has its own Tailwind build via `@tailwindcss/vite`. It also creates `app/assets/builds/` (with the `.gitignore` entries for it) and appends a `css: npm run build:css --watch` line to `Procfile.dev` — keep both of those as generated.

`cssbundling-rails`'s installer assumes Yarn or Bun for the package-install step, and this project uses npm (`package-lock.json`, no `yarn.lock`) — it will either fail outright (no `yarn` binary) or, worse, silently create a stray `yarn.lock`. Don't rely on it; install `@tailwindcss/cli` explicitly via npm instead, and check for/remove any `yarn.lock` it may have created:

```bash
npm install @tailwindcss/cli
rm -f yarn.lock  # only if it appeared; this project's package manager is npm
```

Remove the unused default stylesheet:

```bash
rm app/assets/stylesheets/application.tailwind.css
```

Edit `package.json`'s `build:css` script (added by the generator under `"scripts"`) to read:

```json
"build:css": "tailwindcss -i ./app/assets/stylesheets/active_admin.css -o ./app/assets/builds/active_admin.css --minify"
```

Confirm `npm run check` still passes afterward, to catch any accidental breakage of the existing frontend's Tailwind setup.

Run the build once so the compiled CSS exists on disk (`cssbundling-rails` gitignores `app/assets/builds/*`, so nothing is committed — this file must be (re)built on every fresh checkout, which is what the `Procfile.dev` watcher handles for local dev):

```bash
bin/rails css:build
```

Expected: `app/assets/builds/active_admin.css` now exists and contains real compiled CSS (not the raw `@import "tailwindcss";` from the source file).

- [ ] **Step 5: Wire authentication — edit `config/initializers/active_admin.rb`**

Find these three generated (commented-out) lines and uncomment/fix them:

```ruby
  # config.authentication_method = :authenticate_user!
```
→
```ruby
  config.authentication_method = :authenticate_admin!
```

```ruby
  # config.current_user_method = :current_user
```
→
```ruby
  config.current_user_method = :current_user
```

Leave `config.logout_link_path = :destroy_user_session_path` as generated (already correct, not commented out).

At the very end of the same file (after the `ActiveAdmin.setup do |config| ... end` block), add:

```ruby
ActiveAdmin::BaseController.class_eval do
  def authenticate_admin!
    authenticate_user!
    redirect_to root_path, alert: "You are not authorized to access this page." unless current_user.admin?
  end
end
```

This must be defined on `ActiveAdmin::BaseController`, not on `ApplicationController`: ActiveAdmin's controllers inherit from `InheritedResources::Base`, not from `ApplicationController`, so `config.authentication_method` (which does `send(method_name)` on the ActiveAdmin controller instance) would never find a method defined only on `ApplicationController`. `authenticate_user!`/`current_user` themselves are found either way because Devise patches those onto `ActionController::Base` globally.

- [ ] **Step 6: Write the failing request spec**

Create `spec/requests/admin_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Admin panel access", type: :request do
  it "redirects an anonymous visitor to the login page" do
    get "/admin"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "redirects an authenticated non-admin user away with an alert" do
    user = create(:user, role: :client)
    sign_in user
    get "/admin"
    expect(response).to redirect_to(root_path)
    expect(flash[:alert]).to eq("You are not authorized to access this page.")
  end

  it "allows an authenticated admin to reach the admin panel" do
    admin = create(:user, role: :admin)
    sign_in admin
    get "/admin"
    expect(response).to have_http_status(200)
  end
end
```

- [ ] **Step 7: Run the spec and confirm all three examples pass**

```bash
bundle exec rspec spec/requests/admin_spec.rb
```

Expected: `3 examples, 0 failures`. If Step 5 was skipped or misapplied, the second and third examples fail (no auth check means every request gets a 200, not a redirect).

- [ ] **Step 8: Commit**

```bash
git add Gemfile Gemfile.lock config/initializers/active_admin.rb config/routes.rb \
  config/importmap.rb app/admin/dashboard.rb app/assets/stylesheets/active_admin.css \
  app/assets/builds/.keep tailwind-active_admin.config.js app/javascript/application.js \
  package.json package-lock.json Procfile.dev .gitignore spec/requests/admin_spec.rb
git commit -m "Install ActiveAdmin, gated to admin users only"
```

(`git status` first to confirm you're not missing any generator-created file, that `app/assets/builds/active_admin.css` itself is *not* staged — it should already be gitignored — and that no `yarn.lock` got created.)

---

### Task 2: Build the User admin resource

**Files:**
- Create: `app/admin/users.rb`
- Modify: `app/models/user.rb`
- Create: `spec/requests/admin/users_spec.rb`

**Interfaces:**
- Consumes: `authenticate_admin!` from Task 1 (already wired globally — no changes needed here, just exercised by the new specs).
- Produces: `User.ransackable_attributes` / `User.ransackable_associations` — later admin resources (none planned yet) would need their own equivalents; this task's methods are User-specific, not reusable.

- [ ] **Step 1: Allowlist which `User` columns ActiveAdmin/Ransack may filter and sort on**

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

- [ ] **Step 2: Write the failing request specs**

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
    get "/admin/users", params: { q: { role_eq: "sales" } }
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

- [ ] **Step 3: Run the specs and confirm they fail**

```bash
bundle exec rspec spec/requests/admin/users_spec.rb
```

Expected: routing errors (`No route matches [GET] "/admin/users"`) — `app/admin/users.rb` doesn't exist yet, so ActiveAdmin hasn't registered any routes for it.

- [ ] **Step 4: Create the User admin resource**

Create `app/admin/users.rb`:

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
  filter :role, as: :select, collection: -> { User.roles.keys }

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

- [ ] **Step 5: Run the specs and confirm they pass**

```bash
bundle exec rspec spec/requests/admin/users_spec.rb
```

Expected: `6 examples, 0 failures`.

- [ ] **Step 6: Run the full suite to check for regressions**

```bash
bundle exec rspec
```

Expected: all examples pass, including `spec/requests/admin_spec.rb` from Task 1 and the pre-existing specs.

- [ ] **Step 7: Commit**

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
