# A Player is a record owned by a Club, not a User: no email, no password.
class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :position, null: false
      t.integer :hand, null: false
      t.integer :level, null: false

      t.timestamps
    end
  end
end
