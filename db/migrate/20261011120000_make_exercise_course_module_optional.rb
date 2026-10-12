class MakeExerciseCourseModuleOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :exercises, :course_module_id, true
  end
end
