class CreateClubs < ActiveRecord::Migration[8.1]
  def change
    create_table :clubs, id: :uuid do |t|
      t.string :name, null: false
      t.string :location
      t.string :instagram

      t.timestamps
    end

    add_index :clubs, :name, unique: true
  end
end
