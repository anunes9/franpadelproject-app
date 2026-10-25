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
# PlannedClasses, or TrainingClasses being moved, added or unskipped. They are
# checked against the Classes already planned for the Coach, and for each
# Player in any group (other Coaches' groups included). A skipped Class no
# longer takes up its time, so it is never clashed with, and a saved Class
# being moved never clashes with itself. `classes` are also checked against
# each other, for a group's Classes all taking its new duration at once
# (their group then holds the new duration). `ignoring` leaves out one
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

    planned = existing_classes(classes.map(&:date).uniq, except: saved_ids(classes)).group_by(&:date)
    classes.select do |candidate|
      others = planned.fetch(candidate.date, []) + classes.select { |other| other.date == candidate.date }
      others.any? { |other| !other.equal?(candidate) && candidate.interval.overlaps?(other.interval) }
    end.map(&:date).uniq.sort
  end

  private

  # The saved TrainingClasses among `classes`, whose old times do not count.
  def saved_ids(classes)
    classes.select { |candidate| candidate.is_a?(TrainingClass) && candidate.persisted? }.map(&:id)
  end

  def existing_classes(dates, except:)
    groups = ClassGroup.where(coach: @coach)
                       .or(ClassGroup.where(id: ClassGroupPlayer.where(player: @players).select(:class_group_id)))
    groups = groups.where.not(id: @ignoring) if @ignoring

    TrainingClass.where(date: dates, class_group: groups, skipped: false).where.not(id: except)
                 .includes(:class_group)
  end
end
