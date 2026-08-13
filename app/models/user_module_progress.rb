class UserModuleProgress < ApplicationRecord
  belongs_to :user
  belongs_to :course_module

  enum :status, { locked: 0, current: 1, done: 2 }

  validates :progress, numericality: { in: 0..100 }
  validates :course_module_id, uniqueness: { scope: :user_id }
end
