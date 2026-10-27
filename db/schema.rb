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

ActiveRecord::Schema[8.1].define(version: 2026_10_27_100000) do
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

  create_table "break_periods", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.datetime "created_at", null: false
    t.date "ends_on", null: false
    t.string "name", null: false
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_break_periods_on_club_id"
  end

  create_table "class_group_players", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_group_id", null: false
    t.datetime "created_at", null: false
    t.uuid "player_id", null: false
    t.datetime "updated_at", null: false
    t.index ["class_group_id", "player_id"], name: "index_class_group_players_on_class_group_id_and_player_id", unique: true
    t.index ["class_group_id"], name: "index_class_group_players_on_class_group_id"
    t.index ["player_id"], name: "index_class_group_players_on_player_id"
  end

  create_table "class_groups", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "cadence", null: false
    t.uuid "coach_id", null: false
    t.datetime "created_at", null: false
    t.integer "duration", null: false
    t.integer "level", null: false
    t.string "name"
    t.uuid "previous_class_group_id"
    t.time "start_time", null: false
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.string "weekdays", default: [], null: false, array: true
    t.index ["coach_id"], name: "index_class_groups_on_coach_id"
    t.index ["previous_class_group_id"], name: "index_class_groups_on_previous_class_group_id"
  end

  create_table "club_memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["club_id"], name: "index_club_memberships_on_club_id"
    t.index ["user_id", "club_id"], name: "index_club_memberships_on_user_id_and_club_id", unique: true
    t.index ["user_id"], name: "index_club_memberships_on_user_id"
  end

  create_table "clubs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "instagram"
    t.string "location"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_clubs_on_name", unique: true
  end

  create_table "coach_invitations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "accepted_at"
    t.uuid "club_id", null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.uuid "invited_by_id", null: false
    t.string "name", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_coach_invitations_on_club_id"
    t.index ["invited_by_id"], name: "index_coach_invitations_on_invited_by_id"
    t.index ["token_digest"], name: "index_coach_invitations_on_token_digest", unique: true
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
    t.uuid "course_module_id"
    t.datetime "created_at", null: false
    t.text "description", null: false
    t.string "duration"
    t.string "ref", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_module_id"], name: "index_exercises_on_course_module_id"
    t.index ["ref"], name: "index_exercises_on_ref", unique: true
  end

  create_table "players", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.datetime "created_at", null: false
    t.integer "hand", null: false
    t.integer "level", null: false
    t.string "name", null: false
    t.integer "position", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_players_on_club_id"
  end

  create_table "training_class_exercises", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "exercise_id", null: false
    t.integer "position", null: false
    t.uuid "training_class_id", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_training_class_exercises_on_exercise_id"
    t.index ["training_class_id", "exercise_id"], name: "index_training_class_exercises_uniqueness", unique: true
  end

  create_table "training_classes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_group_id", null: false
    t.boolean "coach_added", default: false, null: false
    t.uuid "course_module_id", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.boolean "done", default: false, null: false
    t.integer "kind", default: 0, null: false
    t.boolean "skipped", default: false, null: false
    t.time "start_time", null: false
    t.datetime "updated_at", null: false
    t.index ["class_group_id", "date"], name: "index_training_classes_on_class_group_id_and_date"
    t.index ["class_group_id"], name: "index_training_classes_on_class_group_id"
    t.index ["course_module_id"], name: "index_training_classes_on_course_module_id"
    t.index ["date"], name: "index_training_classes_on_date"
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
    t.datetime "removed_at"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_users_on_club_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["removed_at"], name: "index_users_on_removed_at"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "break_periods", "clubs"
  add_foreign_key "class_group_players", "class_groups", on_delete: :cascade
  add_foreign_key "class_group_players", "players"
  add_foreign_key "class_groups", "class_groups", column: "previous_class_group_id", on_delete: :nullify
  add_foreign_key "class_groups", "users", column: "coach_id"
  add_foreign_key "club_memberships", "clubs"
  add_foreign_key "club_memberships", "users"
  add_foreign_key "coach_invitations", "clubs", on_delete: :cascade
  add_foreign_key "coach_invitations", "users", column: "invited_by_id", on_delete: :cascade
  add_foreign_key "exercise_completions", "exercises"
  add_foreign_key "exercise_completions", "users"
  add_foreign_key "exercises", "course_modules"
  add_foreign_key "players", "clubs"
  add_foreign_key "training_class_exercises", "exercises", on_delete: :cascade
  add_foreign_key "training_class_exercises", "training_classes", on_delete: :cascade
  add_foreign_key "training_classes", "class_groups", on_delete: :cascade
  add_foreign_key "training_classes", "course_modules"
  add_foreign_key "user_module_progresses", "course_modules"
  add_foreign_key "user_module_progresses", "users"
  add_foreign_key "users", "clubs"
end
