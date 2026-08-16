class CreateExercises < ActiveRecord::Migration[8.1]
  def change
    create_table :exercises, id: :uuid do |t|
      t.references :course_module, type: :uuid, null: false, foreign_key: true
      t.string :ref, null: false
      t.string :title, null: false
      t.integer :category, null: false, default: 0
      t.string :duration, null: false
      t.text :description, null: false

      t.timestamps
    end

    add_index :exercises, :ref, unique: true
  end
end
