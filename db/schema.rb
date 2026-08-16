# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_14_140000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.uuid "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "clubs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "instagram"
    t.string "location"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_clubs_on_name", unique: true
  end

  create_table "course_modules", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.string "duration", null: false
    t.integer "level", default: 0, null: false
    t.integer "position", null: false
    t.string "slug", null: false
    t.string "title", null: false
    t.jsonb "topics", default: [], null: false
    t.datetime "updated_at", null: false
    t.index ["level", "position"], name: "index_course_modules_on_level_and_position"
    t.index ["slug"], name: "index_course_modules_on_slug", unique: true
  end

  create_table "exercise_completions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "exercise_id", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["exercise_id"], name: "index_exercise_completions_on_exercise_id"
    t.index ["user_id", "exercise_id"], name: "index_exercise_completions_on_user_and_exercise", unique: true
    t.index ["user_id"], name: "index_exercise_completions_on_user_id"
  end

  create_table "exercises", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "category"
    t.text "content"
    t.uuid "course_module_id", null: false
    t.datetime "created_at", null: false
    t.text "description", null: false
    t.string "duration"
    t.string "ref", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_module_id"], name: "index_exercises_on_course_module_id"
    t.index ["ref"], name: "index_exercises_on_ref", unique: true
  end

  create_table "user_module_progresses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "course_module_id", null: false
    t.datetime "created_at", null: false
    t.integer "progress", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["course_module_id"], name: "index_user_module_progresses_on_course_module_id"
    t.index ["user_id", "course_module_id"], name: "index_user_module_progresses_on_user_and_course_module", unique: true
    t.index ["user_id"], name: "index_user_module_progresses_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "age"
    t.uuid "club_id"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "hand"
    t.integer "level"
    t.integer "locale", default: 0, null: false
    t.string "name", null: false
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_users_on_club_id"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "exercise_completions", "exercises"
  add_foreign_key "exercise_completions", "users"
  add_foreign_key "exercises", "course_modules"
  add_foreign_key "user_module_progresses", "course_modules"
  add_foreign_key "user_module_progresses", "users"
  add_foreign_key "users", "clubs"
end
