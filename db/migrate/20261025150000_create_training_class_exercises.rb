# The Exercises a Coach picks for a Class, in the order they were picked. They
# are always Exercises of the Class's Module; the generator never adds any.
class CreateTrainingClassExercises < ActiveRecord::Migration[8.1]
  def change
    create_table :training_class_exercises, id: :uuid do |t|
      # Indexed by the unique index below, which starts with it.
      t.references :training_class, type: :uuid, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.references :exercise, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.integer :position, null: false
      t.timestamps
    end
    add_index :training_class_exercises, %i[training_class_id exercise_id], unique: true,
                                                                             name: "index_training_class_exercises_uniqueness"
  end
end
