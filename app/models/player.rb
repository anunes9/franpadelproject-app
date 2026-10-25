# A person who plays padel at a Club. Players have no account and cannot log
# in; they belong to one Club and are shared by all its Coaches. Their Level
# is informational only.
class Player < ApplicationRecord
  belongs_to :club

  # Position and hand share the values left/right, so their predicates are
  # prefixed (position_left?, hand_left?) to keep them apart.
  enum :position, { left: 0, right: 1, both: 2 }, prefix: true, validate: true
  enum :hand, { left: 0, right: 1 }, prefix: true, validate: true
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }, validate: true

  validates :name, presence: true

  scope :alphabetical, -> { order(:name) }

  def roster_json
    { id: id, name: name, position: position, hand: hand, level: level }
  end
end
