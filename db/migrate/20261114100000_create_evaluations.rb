# Player Evaluations recorded in an Assessment Class, and the Strokes each
# Module works on; see docs/specs/PlayerPerformanceProfile.md.
class CreateEvaluations < ActiveRecord::Migration[8.1]
  def change
    add_column :course_modules, :strokes, :jsonb, default: [], null: false

    # One per Player per Assessment Class. The Coach who recorded it is kept
    # after they are removed from the Club (users are soft-removed).
    create_table :evaluations, id: :uuid do |t|
      # Indexed by the unique index below, which starts with it.
      t.references :training_class, type: :uuid, null: false, foreign_key: true, index: false
      t.references :player, type: :uuid, null: false, foreign_key: true
      t.references :coach, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.text :comment
      t.timestamps
    end
    add_index :evaluations, %i[training_class_id player_id], unique: true

    # One Profile Area or Stroke rated 1 to 10 in an Evaluation.
    create_table :ratings, id: :uuid do |t|
      # Indexed by the unique index below, which starts with it.
      t.references :evaluation, type: :uuid, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.integer :item_kind, null: false
      t.string :item_key, null: false
      t.integer :value, null: false
      t.text :comment
      t.timestamps
    end
    add_index :ratings, %i[evaluation_id item_kind item_key], unique: true
    add_check_constraint :ratings, "value BETWEEN 1 AND 10", name: "ratings_value_range"
  end
end
