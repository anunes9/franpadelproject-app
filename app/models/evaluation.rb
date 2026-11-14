# The Ratings and optional overall comment a Coach records for one Player in
# one Assessment Class; see docs/specs/PlayerPerformanceProfile.md. Recording
# the first Evaluation of an Assessment Class marks the Class done, and while
# it has any, the Class cannot be marked undone or skipped
# (docs/adr/0011-evaluating-marks-the-assessment-class-done.md).
class Evaluation < ApplicationRecord
  COMMENT_MAX_LENGTH = 2000

  belongs_to :training_class
  belongs_to :player
  # The Coach who recorded it, kept after they are removed from the Club.
  belongs_to :coach, class_name: "User"
  has_many :ratings, -> { order(:item_kind, :created_at) }, dependent: :delete_all, inverse_of: :evaluation

  normalizes :comment, with: ->(comment) { comment.strip.presence }

  validates :comment, length: { maximum: COMMENT_MAX_LENGTH }
  validates :player_id, uniqueness: { scope: :training_class_id }
  validate :player_of_the_group, on: :create

  # Whether `training_class` takes Evaluations on `today`: an Assessment
  # Class, not skipped, from its date onwards. Nil when it does, else the
  # reason, as an error code on base.
  def self.refusal_for(training_class, today:)
    if !training_class.assessment? then :not_assessment
    elsif training_class.skipped? then :skipped
    elsif training_class.date > today then :not_yet
    end
  end

  # Records `player`'s Evaluation in `training_class` as `coach` sends it: the
  # whole of it, so items left out are unrated. `ratings` are hashes with
  # kind ("area" or "stroke"), key, value (1-10, blank for unrated) and
  # comment. An Evaluation with no Rating and no comment is removed. Saving
  # one marks the Class done. Returns the Evaluation, refused (with errors,
  # nothing changed) when the Class takes no Evaluations on `today`, the
  # Player is not in its group, or an item is invalid.
  def self.record(training_class:, player:, coach:, comment:, ratings:, today:)
    evaluation = find_or_initialize_by(training_class: training_class, player: player)
    evaluation.coach = coach
    evaluation.comment = comment
    if (reason = refusal_for(training_class, today: today))
      evaluation.errors.add(:base, reason)
      return evaluation
    end

    rows = rating_rows(ratings)
    transaction do
      training_class.lock!
      if rows.empty? && evaluation.comment.nil?
        evaluation.destroy! if evaluation.persisted?
        next
      end

      evaluation.ratings.delete_all if evaluation.persisted?
      rows.each { |row| evaluation.ratings.build(row) }
      unless evaluation.valid? && evaluation.ratings.all?(&:valid?)
        evaluation.ratings.each { |rating| rating.errors.each { |error| evaluation.errors.add(:ratings, error.type) } }
        raise ActiveRecord::Rollback
      end

      evaluation.save!
      training_class.update!(done: true) unless training_class.done?
    end
    evaluation
  end

  # The Ratings to save from the sent ones: those with a value, one per item.
  def self.rating_rows(ratings)
    Array(ratings).filter_map do |rating|
      rating = rating.to_h.symbolize_keys
      next if rating[:value].blank?

      { item_kind: rating[:kind].to_s, item_key: rating[:key].to_s, value: Integer(rating[:value], exception: false) || 0,
        comment: rating[:comment] }
    end.uniq { |row| [row[:item_kind], row[:item_key]] }
  end
  private_class_method :rating_rows

  # How far the Evaluation is: "evaluated" once every Profile Area and every
  # Stroke of the Class's Module is rated, else "partial". A Player with no
  # Evaluation is "none".
  def status
    rated = ratings.map(&:item_id).to_set
    wanted = ProfileArea::KEYS.map { |key| "area:#{key}" } +
             training_class.course_module.strokes.map { |key| "stroke:#{key}" }
    wanted.all? { |id| rated.include?(id) } ? "evaluated" : "partial"
  end

  def as_form_json
    { comment: comment, ratings: ratings.map(&:as_profile_json) }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[training_class_id player_id coach_id created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def player_of_the_group
    return unless training_class && player

    errors.add(:player, :not_in_group) unless training_class.class_group.player_ids.include?(player_id)
  end
end
