# The sales role (1) is gone; its users become clients (2).
class ConvertSalesUsersToClients < ActiveRecord::Migration[8.1]
  def up
    execute "UPDATE users SET role = 2 WHERE role = 1"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
