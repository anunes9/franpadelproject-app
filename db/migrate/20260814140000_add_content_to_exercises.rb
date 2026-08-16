class AddContentToExercises < ActiveRecord::Migration[8.1]
  def change
    add_column :exercises, :content, :text
  end
end
