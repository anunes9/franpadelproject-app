# Class Groups, their Players, and the Classes of their Training Plans. A
# Class is stored as a TrainingClass (training_classes), because Ruby already
# defines Class; see docs/adr/0001-class-is-stored-as-training-class.md.
class CreateClassGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :class_groups, id: :uuid do |t|
      t.references :coach, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.integer :level, null: false
      t.date :starts_on, null: false
      t.integer :cadence, null: false
      t.string :weekdays, array: true, null: false, default: []
      t.time :start_time, null: false
      t.integer :duration, null: false
      t.timestamps
    end

    create_table :class_group_players, id: :uuid do |t|
      t.references :class_group, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :player, type: :uuid, null: false, foreign_key: true
      t.timestamps
    end
    add_index :class_group_players, %i[class_group_id player_id], unique: true

    create_table :training_classes, id: :uuid do |t|
      t.references :class_group, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :course_module, type: :uuid, null: false, foreign_key: true
      t.date :date, null: false
      t.time :start_time, null: false
      t.integer :kind, null: false, default: 0
      t.boolean :done, null: false, default: false
      t.timestamps
    end
    add_index :training_classes, %i[class_group_id date]
    add_index :training_classes, :date
  end
end
