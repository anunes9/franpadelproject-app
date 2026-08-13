class Club < ApplicationRecord
  has_one_attached :logo

  validates :name, presence: true, uniqueness: true

  def to_s
    name
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name location instagram created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
