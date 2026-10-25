# A skipped Class stays in its plan but no longer takes up its time. A Class
# the Coach added by hand is marked, so regenerating a plan can tell it from
# the generated ones.
class AddPlanEditingToTrainingClasses < ActiveRecord::Migration[8.1]
  def change
    add_column :training_classes, :skipped, :boolean, default: false, null: false
    add_column :training_classes, :coach_added, :boolean, default: false, null: false
  end
end
