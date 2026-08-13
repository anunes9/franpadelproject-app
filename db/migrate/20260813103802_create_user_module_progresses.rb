class CreateUserModuleProgresses < ActiveRecord::Migration[8.1]
  def change
    create_table :user_module_progresses, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :course_module, type: :uuid, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.integer :progress, null: false, default: 0

      t.timestamps
    end

    add_index :user_module_progresses, [:user_id, :course_module_id],
              unique: true, name: "index_user_module_progresses_on_user_and_course_module"
  end
end
