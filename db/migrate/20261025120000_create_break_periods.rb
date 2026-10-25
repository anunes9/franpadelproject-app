# A Break Period is a named, inclusive date range of a Club (Christmas,
# Easter, August) in which Training Plans get no Classes.
class CreateBreakPeriods < ActiveRecord::Migration[8.1]
  def change
    create_table :break_periods, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.date :starts_on, null: false
      t.date :ends_on, null: false

      t.timestamps
    end
  end
end
