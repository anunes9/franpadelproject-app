# A named date range of a Club (Christmas, Easter, August) in which its
# Training Plans get no Classes. Both dates are included. Defined by the
# Club's Club Managers.
class BreakPeriod < ApplicationRecord
  belongs_to :club

  validates :name, :starts_on, :ends_on, presence: true
  validate :ends_on_or_after_start

  scope :chronological, -> { order(:starts_on, :ends_on) }

  # The inclusive date range the Training Plan generator skips.
  def date_range
    starts_on..ends_on
  end

  # The Break Period as the Break Periods screens list it.
  def summary_json
    { id: id, name: name, startsOn: starts_on.iso8601, endsOn: ends_on.iso8601 }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name club_id starts_on ends_on created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def ends_on_or_after_start
    return unless starts_on && ends_on && ends_on < starts_on

    errors.add(:ends_on, :on_or_after_start)
  end
end
