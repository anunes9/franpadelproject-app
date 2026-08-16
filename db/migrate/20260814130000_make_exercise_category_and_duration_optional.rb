class MakeExerciseCategoryAndDurationOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :exercises, :category, true
    change_column_default :exercises, :category, from: 0, to: nil
    change_column_null :exercises, :duration, true
  end
end
