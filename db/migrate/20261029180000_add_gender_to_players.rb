# A Player's gender, for finding Players when choosing a Class Group's.
# Optional: Players recorded before it have none.
class AddGenderToPlayers < ActiveRecord::Migration[8.1]
  def change
    add_column :players, :gender, :integer
  end
end
