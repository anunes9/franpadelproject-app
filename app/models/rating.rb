# A Coach's score of one Profile Area or Stroke in an Evaluation, from 1
# (Beginning) to 10 (Mastered), with an optional comment. An item left unrated
# has no Rating.
class Rating < ApplicationRecord
  VALUES = (1..10)
  COMMENT_MAX_LENGTH = 1000

  belongs_to :evaluation

  enum :item_kind, { area: 0, stroke: 1 }, validate: true

  normalizes :comment, with: ->(comment) { comment.strip.presence }

  validates :value, inclusion: { in: VALUES }
  validates :item_key, inclusion: { in: ->(rating) { rating.stroke? ? Stroke::KEYS : ProfileArea::KEYS } }
  validates :comment, length: { maximum: COMMENT_MAX_LENGTH }

  # How the Rating is keyed in JSON: "area:technique", "stroke:bandeja".
  def item_id
    "#{item_kind}:#{item_key}"
  end

  def as_profile_json
    { kind: item_kind, key: item_key, value: value, comment: comment }
  end
end
