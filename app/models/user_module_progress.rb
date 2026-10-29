class UserModuleProgress < ApplicationRecord
  belongs_to :user
  belongs_to :course_module

  enum :status, { locked: 0, current: 1, done: 2 }

  validates :progress, numericality: { in: 0..100 }
  validates :course_module_id, uniqueness: { scope: :user_id }

  def self.ransackable_attributes(_auth_object = nil)
    %w[user_id course_module_id status progress created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
