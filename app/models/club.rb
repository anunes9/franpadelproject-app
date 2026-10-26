class Club < ApplicationRecord
  include OrganizesAttachments

  has_one_attached :logo
  organizes_attachment :logo, folder: -> { "clubs/#{id}/logo" }
  # The Club's active Coaches; removed ones are kept for history but no longer
  # listed (docs/adr/0006-manager-oversight.md).
  has_many :coaches, -> { coach.active }, class_name: "User", inverse_of: :club
  # Every user of the Club, removed Coaches included, which keep it from being
  # deleted.
  has_many :users, dependent: :restrict_with_error
  has_many :club_memberships, dependent: :destroy
  has_many :managers, through: :club_memberships, source: :user
  has_many :players, dependent: :restrict_with_error
  has_many :break_periods, dependent: :destroy
  has_many :coach_invitations, dependent: :destroy

  validates :name, presence: true, uniqueness: true

  def to_s
    name
  end

  # The Club as the dashboard names and links it: in the Club switcher, the
  # Players screens and the Club overview.
  def summary_json
    { id: id, name: name }
  end

  # The Club's Break Periods as inclusive date ranges, in date order: the
  # break_periods: input of the TrainingPlanGenerator.
  def break_period_ranges
    break_periods.chronological.map(&:date_range)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name location instagram created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
