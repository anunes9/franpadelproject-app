# An Exercise has at most one Board, its official court diagram. A Coach's
# library holds any number, so the rule covers Exercises only.
class AddOneBoardPerExercise < ActiveRecord::Migration[8.1]
  def change
    add_index :boards, :boardable_id, unique: true, where: "boardable_type = 'Exercise'",
                                      name: "index_boards_one_per_exercise"
  end
end
