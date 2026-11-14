# A person who plays padel at a Club. Players have no account and cannot log
# in; they belong to one Club and are shared by all its Coaches. Their Level
# is informational only.
class Player < ApplicationRecord
  belongs_to :club
  has_many :class_group_players, dependent: :restrict_with_error
  has_many :class_groups, through: :class_group_players

  # Position and hand share the values left/right, so their predicates are
  # prefixed (position_left?, hand_left?) to keep them apart.
  enum :position, { left: 0, right: 1, both: 2 }, prefix: true, validate: true
  enum :hand, { left: 0, right: 1 }, prefix: true, validate: true
  enum :level, Level::VALUES, validate: true
  # Optional: Players recorded before it was asked have none.
  enum :gender, { male: 0, female: 1 }, validate: { allow_nil: true }

  validates :name, presence: true

  scope :alphabetical, -> { order(:name) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[name club_id level position hand gender created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  # The Player as the Players screens and the Club overview list it.
  def players_json
    { id: id, name: name, position: position, hand: hand, level: level, gender: gender }
  end
end
