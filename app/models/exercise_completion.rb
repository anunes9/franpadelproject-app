class ExerciseCompletion < ApplicationRecord
  belongs_to :user
  belongs_to :exercise

  validates :exercise_id, uniqueness: { scope: :user_id }

  def self.ransackable_attributes(_auth_object = nil)
    %w[user_id exercise_id created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
