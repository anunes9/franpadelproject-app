# Saved Boards (docs/specs/Boards.md, ADR 0010). A Board is scratch until a
# Coach saves it; a saved one belongs to its Coach's library, or later to an
# Exercise as its official Board. The court, its pieces and Steps are one
# versioned document.
class CreateBoards < ActiveRecord::Migration[8.1]
  def change
    create_table :boards, id: :uuid do |t|
      t.references :boardable, polymorphic: true, type: :uuid, null: false, index: false
      t.string :title, null: false
      t.jsonb :document, null: false

      t.timestamps
    end

    add_index :boards, [:boardable_type, :boardable_id, :updated_at]
  end
end
