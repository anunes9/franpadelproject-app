class Club < ApplicationRecord
  include OrganizesAttachments

  has_one_attached :logo
  organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }
  has_many :coaches, -> { where(role: :coach) }, class_name: "User", inverse_of: :club, dependent: :restrict_with_error
  has_many :club_memberships, dependent: :destroy
  has_many :managers, through: :club_memberships, source: :user

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
