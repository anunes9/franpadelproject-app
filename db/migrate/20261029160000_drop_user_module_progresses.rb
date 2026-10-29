# Module Completion is worked out from a Module's content (ADR 0008), so the
# manual "mark as done" rows no longer mean anything. Rolling back restores
# the table, not its rows.
class DropUserModuleProgresses < ActiveRecord::Migration[8.1]
  def change
    drop_table :user_module_progresses, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :course_module, type: :uuid, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.integer :progress, null: false, default: 0

      t.timestamps

      t.index [:user_id, :course_module_id], unique: true, name: "index_user_module_progresses_on_user_and_course_module"
    end
  end
end
