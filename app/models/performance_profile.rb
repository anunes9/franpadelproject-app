# A Player's Performance Profile: their picture built from all their
# Evaluations, across every Class Group, Coach and Level. Derived every time,
# never stored or edited (docs/specs/PlayerPerformanceProfile.md).
#
# The latest Rating of an item is the one from the Evaluation with the latest
# Class date (then start time) that rated it, and its trend compares it with
# the Rating before that.
class PerformanceProfile
  # A latest Rating at or below this (of 10) is an item to improve.
  TO_IMPROVE_AT = 4

  def initialize(player)
    @player = player
  end

  # Newest first, with what the history shows of each.
  def evaluations
    @evaluations ||= @player.evaluations
                            .joins(:training_class)
                            .includes(:ratings, :coach, training_class: %i[course_module class_group])
                            .order("training_classes.date DESC, training_classes.start_time DESC, evaluations.id")
                            .to_a
  end

  # Each Profile Area with its latest value and trend; nil when never rated.
  def areas
    ProfileArea::KEYS.map { |key| item_json("area", key) }
  end

  # Each Stroke ever rated, in Stroke::KEYS order.
  def strokes
    Stroke::KEYS.filter_map { |key| item_json("stroke", key) if history_of("stroke", key).any? }
  end

  # Areas and Strokes whose latest value is at most TO_IMPROVE_AT, lowest
  # first, Areas before Strokes on a tie.
  def to_improve
    (areas + strokes).select { |item| item[:value] && item[:value] <= TO_IMPROVE_AT }
                     .sort_by.with_index { |item, index| [item[:value], index] }
  end

  def as_json(*)
    {
      areas: areas,
      strokes: strokes,
      toImprove: to_improve,
      history: evaluations.map { |evaluation| history_json(evaluation) }
    }
  end

  private

  # The values an item was rated, newest first.
  def history_of(kind, key)
    @values ||= evaluations.each_with_object(Hash.new { |hash, id| hash[id] = [] }) do |evaluation, values|
      evaluation.ratings.each { |rating| values["#{rating.item_kind}:#{rating.item_key}"] << rating.value }
    end
    @values.fetch("#{kind}:#{key}", [])
  end

  def item_json(kind, key)
    latest, previous = history_of(kind, key)
    { kind: kind, key: key, value: latest, previous: previous, trend: trend(latest, previous) }
  end

  def trend(latest, previous)
    return nil if latest.nil? || previous.nil?

    if latest > previous then "up"
    elsif latest < previous then "down"
    else "same"
    end
  end

  def history_json(evaluation)
    training_class = evaluation.training_class
    group = training_class.class_group
    {
      id: evaluation.id,
      classId: training_class.id,
      date: training_class.date.iso8601,
      module: { number: training_class.course_module.position, title: training_class.course_module.title },
      group: { id: group.id, name: group.name, level: group.level },
      coach: evaluation.coach.name,
      comment: evaluation.comment,
      ratings: evaluation.ratings.map(&:as_profile_json)
    }
  end
end
