# Organized Attachment Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store newly uploaded `Club#logo` and `CourseModule#documents` files under human-readable, per-record folders (`clubs/{id}/logo/...`, `course_modules/{slug}/documents/...`) using their original filename, instead of ActiveStorage's default flat random-token keys.

**Architecture:** A single reusable concern, `OrganizesAttachments`, provides an `organizes_attachment(name, folder:)` class macro. It registers an `after_commit(on: %i[create update])` callback that rekeys any attached blob still using a flat (non-organized) key — computing the organized key from the given `folder` lambda plus the blob's sanitized original filename, with a numeric suffix only on an actual collision — by moving the file in storage via the service's plain `download`/`upload`/`delete` calls. `after_commit` (not `after_save`) is required because ActiveStorage itself uploads the blob's bytes to the service in its own `after_commit`, not `after_save` — hooking `after_save` runs before the file actually exists in storage and raises `ActiveStorage::FileNotFoundError`. Blobs whose key already contains `/` are left untouched on every later save, so the rekey happens exactly once per blob.

**Tech Stack:** Rails 8, RSpec + FactoryBot, ActiveStorage (Disk in test/dev, S3-compatible MinIO in production via `config/storage.yml`).

## Global Constraints

- Existing files already in production storage keep their current random keys forever — only blobs attached from here on get organized. (Spec: Non-goals)
- No background job for the rekey step — it runs synchronously inside `after_commit`. (Spec: Non-goals)
- No storage-service-specific code (no S3-only or Disk-only branches) — only the public `download`/`upload`/`delete` methods every `ActiveStorage::Service` implements. (Spec: Architecture)
- The concern must be generically reusable for any future `has_one_attached`/`has_many_attached` declaration, not duplicated per model. (Spec: Goals)
- Once a blob's key contains `/`, it is never touched again on subsequent saves (no churn from unrelated edits like renaming a slug). (Spec: Architecture)
- `organizes_attachment` must be declared *after* the corresponding `has_one_attached`/`has_many_attached` call in the class body, so ActiveStorage's own `after_commit` (which uploads the blob's bytes) runs before ours.
- Raising inside the rekey step cannot roll back the parent record's save (the transaction already committed by the time `after_commit` runs) — it only surfaces as a propagated exception, while the blob is left under its original flat key and gets retried on the record's next save.

---

### Task 1: `OrganizesAttachments` concern + `Club#logo`

**Files:**
- Create: `app/models/concerns/organizes_attachments.rb`
- Modify: `app/models/club.rb:1-3`
- Test: `spec/models/club_spec.rb`

**Interfaces:**
- Produces: `OrganizesAttachments` (module, `extend ActiveSupport::Concern`), providing:
  - Class macro `organizes_attachment(name, folder:)` — `name` is the attachment association name (e.g. `:logo`), `folder` is a zero-arg lambda evaluated in the record's instance context (e.g. `-> { "clubs/#{id}/logo" }`), returning the destination folder string.
  - `OrganizesAttachments.unique_key(folder, filename)` — returns `"#{folder}/#{sanitized_filename}"`, or with a `-2`/`-3`/... suffix before the extension if that exact key is already taken by another blob.
  - `OrganizesAttachments.rekey!(blob, new_key)` — moves `blob`'s file to `new_key` in its storage service and updates `blob.key`.
- Consumes: nothing from other tasks (this task creates the shared foundation Task 2 builds on).

- [ ] **Step 1: Write the failing tests**

Append to `spec/models/club_spec.rb` (inside the existing `RSpec.describe Club, type: :model do ... end` block, after the existing `to_s` example):

```ruby
  describe "organized logo storage" do
    it "stores the logo under clubs/{id}/logo/{filename}" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/logo.png")
    end

    it "organizes the logo even when it's attached before the club is first saved" do
      club = build(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
      club.save!

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/logo.png")
    end

    it "sanitizes unsafe characters in the filename before using it as a key" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "weird/name.png", content_type: "image/png")

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/weird-name.png")
    end

    it "leaves an already-organized blob's key alone on a later, unrelated save" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
      organized_key = club.logo.blob.key

      club.update!(name: "#{club.name} Updated")

      expect(club.logo.blob.key).to eq(organized_key)
    end
  end
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `bundle exec rspec spec/models/club_spec.rb -e "organized logo storage"`
Expected: FAIL — the first three examples fail because `club.logo.blob.key` is still ActiveStorage's default random token, not the organized path (e.g. `expected: "clubs/1/logo/logo.png", got: "eq7f...")`.

- [ ] **Step 3: Create the concern**

Create `app/models/concerns/organizes_attachments.rb`:

```ruby
module OrganizesAttachments
  extend ActiveSupport::Concern

  class_methods do
    def organizes_attachment(name, folder:)
      after_commit(on: %i[create update]) do
        attached = public_send(name)
        blobs =
          if attached.respond_to?(:each)
            attached.map(&:blob)
          elsif attached.attached?
            [attached.blob]
          else
            []
          end

        blobs.each do |blob|
          next if blob.key.include?("/")

          folder_path = instance_exec(&folder)
          OrganizesAttachments.rekey!(blob, OrganizesAttachments.unique_key(folder_path, blob.filename.to_s))
        end
      end
    end
  end

  def self.unique_key(folder, filename)
    sanitized = ActiveStorage::Filename.new(filename).sanitized
    ext = File.extname(sanitized)
    base = File.basename(sanitized, ext)

    candidate = "#{folder}/#{sanitized}"
    suffix = 2
    while ActiveStorage::Blob.exists?(key: candidate)
      candidate = "#{folder}/#{base}-#{suffix}#{ext}"
      suffix += 1
    end
    candidate
  end

  def self.rekey!(blob, new_key)
    service = blob.service
    content = service.download(blob.key)
    service.upload(new_key, StringIO.new(content), checksum: blob.checksum)
    service.delete(blob.key)
    blob.update!(key: new_key)
  end
end
```

- [ ] **Step 4: Wire the concern into `Club`**

Modify `app/models/club.rb:1-3` from:

```ruby
class Club < ApplicationRecord
  has_one_attached :logo
  has_many :users, dependent: :nullify
```

to:

```ruby
class Club < ApplicationRecord
  include OrganizesAttachments

  has_one_attached :logo
  organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }
  has_many :users, dependent: :nullify
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `bundle exec rspec spec/models/club_spec.rb`
Expected: PASS (all examples, including the pre-existing ones — confirms nothing else on `Club` broke).

- [ ] **Step 6: Commit**

```bash
git add app/models/concerns/organizes_attachments.rb app/models/club.rb spec/models/club_spec.rb
git commit -m "Organize club logo uploads into per-club storage folders"
```

---

### Task 2: `CourseModule#documents`

**Files:**
- Modify: `app/models/course_module.rb:1-5`
- Test: `spec/models/course_module_spec.rb`

**Interfaces:**
- Consumes: `OrganizesAttachments` and `organizes_attachment(name, folder:)` from Task 1 (already created; not modified here).
- Produces: nothing new consumed elsewhere — this is the last task.

- [ ] **Step 1: Write the failing tests**

Append to `spec/models/course_module_spec.rb` (inside the existing `RSpec.describe CourseModule, type: :model do ... end` block, after the existing `#documents_json` describe block):

```ruby
  describe "organized document storage" do
    it "stores a document under course_modules/{slug}/documents/{filename}" do
      course_module = create(:course_module, slug: "beginner-101")
      course_module.documents.attach(io: StringIO.new("pdf"), filename: "syllabus.pdf", content_type: "application/pdf")

      expect(course_module.documents.first.blob.key).to eq("course_modules/beginner-101/documents/syllabus.pdf")
    end

    it "suffixes the key when two documents share the same filename" do
      course_module = create(:course_module, slug: "beginner-101")
      course_module.documents.attach(io: StringIO.new("pdf one"), filename: "syllabus.pdf", content_type: "application/pdf")
      course_module.documents.attach(io: StringIO.new("pdf two"), filename: "syllabus.pdf", content_type: "application/pdf")

      keys = course_module.documents.map { |document| document.blob.key }
      expect(keys).to contain_exactly(
        "course_modules/beginner-101/documents/syllabus.pdf",
        "course_modules/beginner-101/documents/syllabus-2.pdf"
      )
    end

    it "organizes documents attached through the new_documents= writer used by the admin form" do
      course_module = create(:course_module, slug: "beginner-101")

      course_module.new_documents = [{ io: StringIO.new("pdf"), filename: "handout.pdf", content_type: "application/pdf" }]

      expect(course_module.documents.first.blob.key).to eq("course_modules/beginner-101/documents/handout.pdf")
    end
  end
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `bundle exec rspec spec/models/course_module_spec.rb -e "organized document storage"`
Expected: FAIL — each example fails because the stored blob key is still a default random token, not the organized path.

- [ ] **Step 3: Wire the concern into `CourseModule`**

Modify `app/models/course_module.rb:1-5` from:

```ruby
class CourseModule < ApplicationRecord
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }

  has_many :user_module_progresses, dependent: :destroy
  has_many_attached :documents
```

to:

```ruby
class CourseModule < ApplicationRecord
  include OrganizesAttachments

  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }

  has_many :user_module_progresses, dependent: :destroy
  has_many_attached :documents
  organizes_attachment :documents, folder: -> { "course_modules/#{slug}/documents" }
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `bundle exec rspec spec/models/course_module_spec.rb`
Expected: PASS (all examples, including the pre-existing ones).

- [ ] **Step 5: Run the full suite**

Run: `bundle exec rspec`
Expected: PASS — confirms nothing elsewhere (admin specs, request specs) regressed.

- [ ] **Step 6: Commit**

```bash
git add app/models/course_module.rb spec/models/course_module_spec.rb
git commit -m "Organize course module document uploads into per-module storage folders"
```
