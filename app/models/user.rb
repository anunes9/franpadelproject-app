class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, sales: 1, client: 2 }

  has_many :user_module_progresses, dependent: :destroy

  def self.ransackable_attributes(_auth_object = nil)
    %w[email role created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
