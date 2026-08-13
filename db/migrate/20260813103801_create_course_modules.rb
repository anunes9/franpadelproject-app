class CreateCourseModules < ActiveRecord::Migration[8.1]
  def change
    create_table :course_modules, id: :uuid do |t|
      t.string :slug, null: false
      t.integer :level, null: false, default: 0
      t.integer :position, null: false
      t.string :title, null: false
      t.string :description, null: false
      t.string :duration, null: false
      t.jsonb :topics, null: false, default: []
      t.text :content

      t.timestamps
    end

    add_index :course_modules, :slug, unique: true
    add_index :course_modules, [:level, :position]
  end
end
