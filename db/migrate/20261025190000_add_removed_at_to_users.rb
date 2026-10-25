# When a user was removed: they keep their account and history but lose
# access (docs/adr/0006-manager-oversight.md). Null for active users.
class AddRemovedAtToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :removed_at, :datetime
    add_index :users, :removed_at
  end
end
