# An Exercise a Coach picked for a Class. Only an Exercise of the Class's own
# Module can be picked, and each one once. `position` keeps the order they
# were picked in.
class TrainingClassExercise < ApplicationRecord
  belongs_to :training_class
  belongs_to :exercise

  validates :exercise_id, uniqueness: { scope: :training_class_id }
  validate :exercise_of_the_class_module

  private

  def exercise_of_the_class_module
    return unless exercise && training_class
    return if exercise.course_module_id == training_class.course_module_id

    errors.add(:exercise, :other_module)
  end
end
