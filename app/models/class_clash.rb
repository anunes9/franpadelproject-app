# The clash rule: a Coach, and a Player, can never have two Classes that
# overlap in time. Overlap compares the full interval (start time plus the
# group's duration) on the same date, so a 60-minute Class at 18:00 clashes
# with a 90-minute Class at 18:30, while one ending at 19:00 does not clash
# with one starting at 19:00.
#
#   ClassClash.new(coach: coach, players: players, ignoring: group)
#     .dates(classes) # => the dates of `classes` that clash, in order
#
# `classes` are anything with #date and #interval (a ClassInterval): generated
# PlannedClasses, or TrainingClasses being moved or added. They are checked
# against the Classes already planned for the Coach, and for each Player in
# any group (other Coaches' groups included). `ignoring` leaves out one
# group's own Classes, for edits that replace them.
class ClassClash
  def initialize(coach:, players:, ignoring: nil)
    @coach = coach
    @players = Array(players)
    @ignoring = ignoring
  end

  # Locks the Coach and the Players for the rest of the transaction, so two
  # concurrent changes involving any of them cannot both pass the check.
  def self.lock(coach:, players:)
    User.where(id: coach).lock.load
    Player.where(id: Array(players).map(&:id)).order(:id).lock.load
  end

  def dates(classes)
    classes = Array(classes)
    return [] if classes.empty?

    planned = existing_classes(classes.map(&:date).uniq).group_by(&:date)
    classes.select do |candidate|
      planned.fetch(candidate.date, []).any? { |other| candidate.interval.overlaps?(other.interval) }
    end.map(&:date).uniq.sort
  end

  private

  def existing_classes(dates)
    groups = ClassGroup.where(coach: @coach)
                       .or(ClassGroup.where(id: ClassGroupPlayer.where(player: @players).select(:class_group_id)))
    groups = groups.where.not(id: @ignoring) if @ignoring

    TrainingClass.where(date: dates, class_group: groups).includes(:class_group)
  end
end
