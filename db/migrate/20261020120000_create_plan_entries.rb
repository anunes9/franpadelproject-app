class CreatePlanEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :plan_entries, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :plannable, type: :uuid, null: false, polymorphic: true
      t.integer :day, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :plan_entries, [:user_id, :day, :plannable_type, :plannable_id],
              unique: true, name: "index_plan_entries_on_user_day_and_plannable"
  end
end
