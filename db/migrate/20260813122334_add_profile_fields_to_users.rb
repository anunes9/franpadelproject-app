class AddProfileFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string
    add_column :users, :age, :integer
    add_column :users, :level, :integer
    add_column :users, :hand, :integer
    add_reference :users, :club, type: :uuid, foreign_key: true

    reversible do |dir|
      dir.up { execute "UPDATE users SET name = split_part(email, '@', 1) WHERE name IS NULL" }
    end

    change_column_null :users, :name, false
  end
end
