class Club < ApplicationRecord
  include OrganizesAttachments

  has_one_attached :logo
  organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }
  has_many :users, dependent: :nullify

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
