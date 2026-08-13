# Organized attachment storage

## Overview

Today all uploaded files (`Club#logo`, `CourseModule#documents`) sit in one
flat bucket/directory under ActiveStorage's default random-token keys — there
is no way to tell, by browsing the storage bucket, which file belongs to
which club or course module. This adds a small, reusable concern that
organizes new uploads into per-record folders and keeps their original
filename as the storage key, without touching the existing attach call
sites, admin forms, or download/display code.

## Goals

- New/replacement uploads for `Club#logo` and `CourseModule#documents` are
  stored under a human-readable, per-record folder:
  - `clubs/{id}/logo/{filename}`
  - `course_modules/{slug}/documents/{filename}`
- The storage key uses the original uploaded filename (sanitized), not a
  random token.
- Works identically whether the record is created with the attachment in the
  same request (id/slug not yet known at attach time) or the attachment is
  added later to an already-persisted record.
- Reusable for any future `has_one_attached`/`has_many_attached` on another
  model, not one-off code duplicated per model.

## Non-goals

- Migrating/renaming files already in storage under the old random-key
  scheme — they keep working as-is; only newly attached files (from here on)
  get organized.
- Deduplication of identical file contents across records — out of scope,
  matches current behavior (each attach creates its own blob).
- A background job for the rekey step — uploads here are small (PDFs,
  images) and infrequent (admin-only), so doing it synchronously right after
  save is simpler and sufficient.
- Any change to how files are served, downloaded, or displayed
  (`documents_json`, `rails_blob_path`, filenames shown in the admin) — all
  of that already uses the blob's `filename` column, which is untouched by
  this change.

## Architecture

A new concern, `OrganizesAttachments`, included by both `Club` and
`CourseModule`. It provides a class macro used alongside the existing
attachment declaration:

```ruby
class Club < ApplicationRecord
  include OrganizesAttachments
  has_one_attached :logo
  organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }
```

```ruby
class CourseModule < ApplicationRecord
  include OrganizesAttachments
  has_many_attached :documents
  organizes_attachment :documents, folder: -> { "course_modules/#{slug}/documents" }
```

`organizes_attachment` registers an `after_commit` callback (on create/update). After the record's transaction commits (the point at which ActiveStorage itself has actually finished uploading bytes to the service, not merely saved the blob row), it
looks at every blob currently attached to that association and, for each one
whose storage key is still a "flat" default token (no `/` in it), computes
an organized key and moves the underlying file to that key.

This piggybacks on the fact that `has_one_attached`/`has_many_attached`
writers (`logo=`, `documents.attach`) upload the file and create the blob
*immediately*, before the parent record is necessarily saved — so at attach
time, a new record's `id` may not exist yet. Rather than special-casing
create vs. update at the writer, the callback simply runs after save, by
which point the id (and any other persisted attribute the `folder` lambda
depends on, e.g. `slug`) is guaranteed to exist. The very first upload on a
brand-new record gets organized exactly the same way as one added later.

Once a blob's key contains `/`, the callback leaves it alone permanently —
so unrelated future saves (e.g. editing a course module's `slug` or
description) never trigger file movement. Organizing a given blob happens
exactly once, right after it's first attached and saved.

## Path scheme

- `clubs/{id}/logo/{filename}`
- `course_modules/{slug}/documents/{filename}`

Filenames are sanitized with Rails' own `ActiveStorage::Filename#sanitized`
(strips control characters, replaces path separators) — the same
sanitization Rails already applies when displaying/downloading a filename,
so no new sanitization rules are introduced.

**Collision handling:** the key is first tried as-is (`folder/filename`). If
a blob with that exact key already exists (checked via
`ActiveStorage::Blob.exists?(key:)`), a numeric suffix is inserted before
the extension (`syllabus-2.pdf`, `syllabus-3.pdf`, ...) until a free key is
found. This only affects the storage key — the blob's `filename` column
(what's shown/downloaded) always stays the original, unsuffixed name.

## Components

- `app/models/concerns/organizes_attachments.rb`:
  - `organizes_attachment(name, folder:)` class macro, registers the
    `after_commit` callback described above (Active Storage's own `has_one_attached`/`has_many_attached` upload the file's bytes in their own `after_commit`, not `after_save` — see Architecture).
  - A private helper to build the organized key (sanitize + collision-suffix
    loop, as described above).
  - A private helper to actually move a blob to a new key, implemented using
    only the storage service's public interface — `service.download`,
    `service.upload`, `service.delete` — so it works the same way for the
    local `Disk` service and the Railway S3-compatible bucket without any
    service-specific code:
    1. Download the blob's current content.
    2. Upload it under the new key (passing the existing `checksum` so the
       service can verify it matches).
    3. Delete the old key.
    4. Update `blob.key` to the new value and save the blob.
- `app/models/club.rb` — `include OrganizesAttachments`,
  `organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }`. No other
  change; `logo=` (used by ActiveAdmin's standard `permit_params :logo`)
  keeps working exactly as today.
- `app/models/course_module.rb` — `include OrganizesAttachments`,
  `organizes_attachment :documents, folder: -> { "course_modules/#{slug}/documents" }`.
  No change to the existing `new_documents=` append-only writer.

## Data flow

1. Admin submits a club/course module form with a new logo/document(s), same
   as today — `logo=` or `new_documents=` attaches the file(s), each getting
   a normal ActiveStorage random key at this point (id/slug may not exist
   yet for a brand-new record).
2. The record saves.
3. `after_commit` (from `organizes_attachment`) runs: for each attached blob
   on that association with a flat (non-organized) key, it computes the
   target key from the `folder` lambda (now safe to evaluate — the record
   is persisted) + sanitized filename, and rekeys the blob in storage as
   described above.
4. Subsequent saves of the same record (unrelated field edits, additional
   documents) only touch blobs that are still flat-keyed; already-organized
   blobs are skipped every time.

## Error handling

- Because the rekey step runs in `after_commit`, the parent record's save
  has already committed by the time it runs — a failure here **cannot**
  roll back the club/course module save or the attachment itself (there is
  no surrounding transaction left to abort). If the rekey step fails (e.g. a
  transient storage error during download/upload/delete), the exception
  still propagates out of `save`/`save!`, so it's visible in the request's
  error response/logs, but the record and its attachment are left intact
  under the blob's original flat key — which still works fine, just isn't
  organized yet. Since our check is "does the key contain `/`", the next
  time that record is saved, the callback retries the same blob and
  organizes it then. No dedicated retry mechanism is needed — this falls
  out naturally from checking the key's shape rather than tracking "already
  attempted" state.
- If the delete of the old key fails *after* the new key has already been
  uploaded and `blob.key` updated, the old file is orphaned in storage
  (wasted space, not user-visible, no dangling reference since nothing
  points at the old key anymore). Not automatically cleaned up — accepted
  as a known limitation given how few files this app handles; not worth a
  reconciliation job.
- Existing files already in production storage keep their current random
  keys indefinitely; nothing in this change touches them.

## Testing

- `spec/models/concerns/organizes_attachments_spec.rb` (using a lightweight
  test double model, or directly against `Club`/`CourseModule`):
  - Attaching a file organizes its key to `folder/filename`.
  - Attaching a second file with the same filename to the same folder gets
    a `-2` suffix; a third gets `-3`.
  - A blob that's already organized (key contains `/`) is left untouched
    across a later, unrelated save.
  - A filename with unsafe characters (e.g. slashes) is sanitized before
    being used in the key.
  - The blob's `filename` column (display name) is unchanged by rekeying —
    only `key` changes.
- `spec/models/club_spec.rb` / `spec/models/course_module_spec.rb`: a
  focused example confirming the concrete `clubs/{id}/logo/...` and
  `course_modules/{slug}/documents/...` patterns end-to-end, including the
  create-with-attachment-in-the-same-request case (id/slug not known until
  after save).
- Runs against the `test` Disk service already configured in
  `config/storage.yml` — no S3/MinIO access needed in tests.
