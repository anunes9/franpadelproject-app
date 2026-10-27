# A Class Group's own name, set by its Coach. Optional: a group without one
# is shown by its Level.
class AddNameToClassGroups < ActiveRecord::Migration[8.1]
  def change
    add_column :class_groups, :name, :string
  end
end
