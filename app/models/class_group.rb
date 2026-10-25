# A group of one to eight Players taught by one Coach, tied to one Course
# through its Level. Its Club is its Coach's Club. Its Training Plan is its
# Classes (TrainingClass), generated up front when the group is created.
class ClassGroup < ApplicationRecord
  MAX_PLAYERS = 8
  CADENCES = TrainingPlanGenerator::CADENCE_WEEKS_PER_MODULE.keys.freeze
  DURATIONS = TrainingPlanGenerator::DURATIONS
  WEEKDAYS = TrainingPlanGenerator::WEEKDAYS.map(&:to_s).freeze

  belongs_to :coach, class_name: "User"
  has_many :class_group_players, dependent: :destroy
  has_many :players, through: :class_group_players
  has_many :training_classes, -> { order(:date, :start_time) }, dependent: :destroy, inverse_of: :class_group
  # The finished group this one continues at the next Level, when the Coach
  # started it from one. A link for history only.
  belongs_to :previous_class_group, class_name: "ClassGroup", optional: true

  enum :level, Level::VALUES, validate: true

  # A start time is a wall-clock time at the Club, never shifted by time zone.
  self.skip_time_zone_conversion_for_attributes = [:start_time]

  validates :starts_on, :start_time, presence: true
  validates :cadence, inclusion: { in: CADENCES }
  validates :duration, inclusion: { in: DURATIONS }
  validate :weekdays_match_cadence
  validate :classes_end_by_midnight
  validate :saved_classes_end_by_midnight, on: :update, if: :will_save_change_to_duration?
  validate :players_within_limit
  validate :players_of_the_coachs_club
  validate :owned_by_a_coach
  validate :continues_at_the_next_level, on: :create

  delegate :club, to: :coach

  # The dates of the generated Classes that would have overlapped another
  # Class of the Coach or of a Player, after a refused #create_with_plan or
  # #regenerate_plan.
  attr_reader :clashing_dates

  # A group is finished when at least one of its Classes is done and every
  # Class is done or skipped; see docs/adr/0007-finished-class-groups.md.
  # Derived, never stored, so marking a Class undone makes it unfinished.
  FINISHED_SQL = <<~SQL.squish.freeze
    EXISTS (SELECT 1 FROM training_classes done_classes
            WHERE done_classes.class_group_id = class_groups.id AND done_classes.done)
    AND NOT EXISTS (SELECT 1 FROM training_classes open_classes
                    WHERE open_classes.class_group_id = class_groups.id
                      AND NOT open_classes.done AND NOT open_classes.skipped)
  SQL

  scope :finished, -> { where(FINISHED_SQL) }
  scope :unfinished, -> { where.not(FINISHED_SQL) }
  # Loads whether each group is finished with the groups, for lists.
  scope :with_finished, -> { select(arel_table[Arel.star], Arel.sql("(#{FINISHED_SQL}) AS finished_flag")) }

  # The groups of a Club: those whose Coach belongs to it.
  scope :of_clubs, ->(clubs) { joins(:coach).where(users: { club_id: clubs }) }

  # The groups a user may see: a Coach's own, or every group of a Club
  # Manager's linked Clubs. Admins work through the admin screens instead.
  def self.visible_to(user)
    if user.coach?
      where(coach: user)
    elsif user.club_manager?
      of_clubs(user.managed_clubs.select(:id))
    else
      none
    end
  end

  # The Modules of the group's Course, in order: those its Training Plan is
  # generated from and its Classes can be for.
  def course_modules
    CourseModule.teaching_for(level)
  end

  # See FINISHED_SQL: read with the group when it was loaded .with_finished,
  # else asked of the database.
  def finished?
    return finished_flag if has_attribute?(:finished_flag)

    persisted? && self.class.finished.exists?(id)
  end

  # The Level of the Course after this group's, which a finished group's
  # Players can continue at; nil for Advanced.
  def next_level
    Level.next(level)
  end

  def weekdays=(value)
    super(Array(value).compact_blank.map(&:to_s))
  end

  # Saves the group with its whole Training Plan, or nothing at all. Refused
  # when the group is invalid, when its Course has no Modules, or when any
  # generated Class would overlap in time with another Class of the Coach or
  # of one of the Players (the clashing dates are then in #clashing_dates), or
  # when saving fails.
  def create_with_plan
    @clashing_dates = []
    return false unless valid?

    planned = generate_plan(modules: course_modules, start_date: starts_on)
    return false unless planned

    with_plan_lock { save_plan(planned) { save! } }
  rescue ActiveRecord::ActiveRecordError => error
    not_saved(error)
  end

  # Regenerates the Training Plan on the Coach's request (docs/adr/0005):
  # keeps the done Classes with their Exercises and replaces every other Class,
  # continuing the Course from its first incomplete Module, on the group's
  # current schedule, from the later of `today` and the day after the last
  # done Class. Refused, changing nothing, when the group is invalid, when its
  # Course has no Modules, when every Module is complete (base: plan_complete),
  # or when a new Class would clash (the dates are then in #clashing_dates).
  def regenerate_plan(today:)
    @clashing_dates = []
    return false unless valid?

    # Everything that decides the new plan is read under the lock, so the
    # plan, the Classes it replaces and the delete agree with each other.
    with_plan_lock do
      planned, replaced = plan_regeneration(today)
      next false unless planned

      save_plan(planned, replacing: replaced) do
        # Still not done: marking a Class done takes no lock, and a Class
        # marked done meanwhile is kept.
        replaced_classes = TrainingClass.where(id: replaced, done: false)
        TrainingClassExercise.where(training_class: replaced_classes).delete_all
        replaced_classes.delete_all
      end
    end
  rescue ActiveRecord::ActiveRecordError => error
    not_saved(error)
  end

  # Saves an edit of the group's Players and schedule, or nothing at all; see
  # docs/adr/0004-editing-a-class-group.md. Its Classes keep their dates,
  # start times and Modules: a new cadence, weekdays or start time only takes
  # effect when the plan is regenerated. A new duration is the exception, as
  # every Class lasts as long as its group's Classes. Refused when the group
  # would be invalid, or when an added Player or a new duration would make one
  # of its upcoming Classes (dated `today` or later, neither done nor skipped)
  # overlap in time with another Class of the Coach or of a Player (the
  # clashing dates are then in #clashing_dates). Past and done Classes are
  # history, so they never refuse an edit, though they take the new duration.
  def update_with_clash_check(attributes, today:)
    @clashing_dates = []
    saved = false

    transaction do
      ClassClash.lock(coach: coach, players: players.to_a | Player.where(id: attributes[:player_ids]).to_a)
      previous_player_ids = player_ids
      assign_attributes(attributes)
      raise ActiveRecord::Rollback unless valid?

      if (player_ids - previous_player_ids).any? || duration_changed?
        @clashing_dates = ClassClash.new(coach: coach, players: players).dates(upcoming_classes(today))
      end
      if @clashing_dates.any?
        errors.add(:base, :clash)
        raise ActiveRecord::Rollback
      end

      saved = save!
    end
    saved
  rescue ActiveRecord::ActiveRecordError => error
    Rails.logger.error("Class Group not edited: #{error.class}: #{error.message}")
    errors.add(:base, :not_saved)
    false
  end

  # Hands the group to `new_coach`, another Coach of its Club, on a Club
  # Manager's request (docs/adr/0006-manager-oversight.md). The Training Plan
  # is kept as it is. Refused, changing nothing, when there is no such user
  # (coach: blank), when they are not a Coach (coach: not_a_coach), when they
  # belong to another Club (coach: other_club), or when one of the group's
  # upcoming Classes (dated `today` or later, neither done nor skipped) would
  # overlap in time with another Class of the new Coach (the clashing dates
  # are then in #clashing_dates).
  def reassign_to(new_coach, today:)
    @clashing_dates = []
    reason = reassignment_refusal(new_coach)
    if reason
      errors.add(:coach, reason)
      return false
    end

    saved = false
    transaction do
      # The group too, so two reassignments of it run one after the other and
      # the one that wins is the one that was clash-checked.
      lock!
      ClassClash.lock(coach: new_coach, players: players)
      @clashing_dates = ClassClash.new(coach: new_coach, players: []).dates(upcoming_classes(today))
      if @clashing_dates.any?
        errors.add(:base, :clash)
        raise ActiveRecord::Rollback
      end

      self.coach = new_coach
      raise ActiveRecord::Rollback unless save

      saved = true
    end
    restore_attributes unless saved
    saved
  rescue ActiveRecord::ActiveRecordError => error
    restore_attributes
    not_saved(error)
  end

  # "18:00"
  def start_time_text
    start_time&.strftime("%H:%M")
  end

  # The group as its page shows it.
  def summary_json
    common_json.merge(
      startsOn: starts_on.iso8601,
      cadence: cadence,
      club: club.summary_json,
      players: players.sort_by(&:name).map(&:players_json)
    )
  end

  # The group as the Class Group lists show it. Load the groups
  # .with_finished to read whether each is finished with them.
  def list_json
    common_json.merge(playerCount: players.size)
  end

  # The group as a link to it: "Continues from <group>".
  def link_json
    { id: id, level: level }
  end

  private

  # What every view of the group shows: its Level, its weekly time and Coach.
  def common_json
    {
      id: id,
      level: level,
      weekdays: weekdays,
      startTime: start_time_text,
      duration: duration,
      coach: coach.name,
      finished: finished?
    }
  end

  def generate_plan(modules:, start_date:, done_in_first_module: 0)
    TrainingPlanGenerator.call(
      modules: modules,
      cadence: cadence, weekdays: weekdays.map(&:to_sym), start_time: start_time,
      duration: duration, start_date: start_date, break_periods: club.break_period_ranges,
      done_in_first_module: done_in_first_module
    )
  rescue TrainingPlanGenerator::NoTeachingModules
    errors.add(:level, :no_modules)
    nil
  end

  # The Classes still to be taught: dated `today` or later, neither done nor
  # skipped.
  def upcoming_classes(today)
    training_classes.select { |c| c.date >= today && !c.done? && !c.skipped? }
  end

  # Why #reassign_to refuses `new_coach`, or nil when it does not.
  def reassignment_refusal(new_coach)
    if new_coach.nil? then :blank
    elsif !new_coach.coach? then :not_a_coach
    elsif new_coach.club_id != coach.club_id then :other_club
    end
  end

  # The new plan of #regenerate_plan, and the ids of the Classes it replaces,
  # or nil when refused.
  def plan_regeneration(today)
    done = training_classes.where(done: true).to_a
    modules = course_modules.to_a
    # A Module whose Assessment Class is done is complete.
    complete = done.select(&:assessment?).map(&:course_module_id)
    remaining = modules.reject { |course_module| complete.include?(course_module.id) }
    if modules.any? && remaining.empty?
      errors.add(:base, :plan_complete)
      return
    end

    start_date = [today, done.map(&:date).max&.next_day].compact.max
    done_in_first = done.count { |done_class| done_class.course_module_id == remaining.first&.id }
    planned = generate_plan(modules: remaining, start_date: start_date, done_in_first_module: done_in_first)
    [planned, training_classes.where(done: false).pluck(:id)] if planned
  end

  # Runs the block in one transaction holding ClassClash.lock on the Coach
  # and the Players, and rolls it back unless the block returns true.
  def with_plan_lock
    saved = false
    transaction do
      ClassClash.lock(coach: coach, players: players)
      saved = yield
      raise ActiveRecord::Rollback unless saved
    end
    training_classes.reset
    saved
  end

  # Within #with_plan_lock: saves the planned Classes, after the block, unless
  # any would clash with another Class of the Coach or of a Player. The
  # Classes in `replacing` (ids) are being replaced, so they do not count.
  def save_plan(planned, replacing: [])
    @clashing_dates = ClassClash.new(coach: coach, players: players, replacing: replacing).dates(planned)
    if @clashing_dates.any?
      errors.add(:base, :clash)
      return false
    end

    yield
    planned.each do |planned_class|
      training_classes.create!(date: planned_class.date, start_time: start_time,
                               course_module: planned_class.course_module, kind: planned_class.type)
    end
    true
  end

  def not_saved(error)
    Rails.logger.error("Class Group plan not saved: #{error.class}: #{error.message}")
    errors.add(:base, :not_saved)
    false
  end

  def weekdays_match_cadence
    return if weekdays.size == cadence && weekdays.uniq.size == weekdays.size && (weekdays - WEEKDAYS).empty?

    errors.add(:weekdays, :cadence_mismatch)
  end

  # A Class ends on its own day, so the clash rule compares same-date Classes.
  def classes_end_by_midnight
    return unless start_time && DURATIONS.include?(duration)

    errors.add(:start_time, :crosses_midnight) if ClassInterval.of(start_time, duration).crosses_midnight?
  end

  # A new duration applies to the Classes already planned, moved ones included.
  def saved_classes_end_by_midnight
    return unless DURATIONS.include?(duration)

    errors.add(:duration, :crosses_midnight) if training_classes.any? { |c| c.interval.crosses_midnight? }
  end

  def players_within_limit
    if players.empty?
      errors.add(:players, :blank)
    elsif players.size > MAX_PLAYERS
      errors.add(:players, :too_many, count: MAX_PLAYERS)
    end
  end

  def players_of_the_coachs_club
    return unless coach
    return if players.all? { |player| player.club_id == coach.club_id }

    errors.add(:players, :other_club)
  end

  def owned_by_a_coach
    errors.add(:coach, :not_a_coach) if coach && !coach.coach?
  end

  # A group continuing a finished one is at the Level after it
  # (docs/adr/0007-finished-class-groups.md).
  def continues_at_the_next_level
    return unless previous_class_group
    return if level == previous_class_group.next_level

    errors.add(:level, :not_next_level)
  end
end
