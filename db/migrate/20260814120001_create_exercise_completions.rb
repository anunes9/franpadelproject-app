class CreateExerciseCompletions < ActiveRecord::Migration[8.1]
  def change
    create_table :exercise_completions, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :exercise, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :exercise_completions, [:user_id, :exercise_id],
              unique: true, name: "index_exercise_completions_on_user_and_exercise"
  end
end
