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

  enum :level, Level::VALUES, validate: true

  # A start time is a wall-clock time at the Club, never shifted by time zone.
  self.skip_time_zone_conversion_for_attributes = [:start_time]

  validates :starts_on, :start_time, presence: true
  validates :cadence, inclusion: { in: CADENCES }
  validates :duration, inclusion: { in: DURATIONS }
  validate :weekdays_match_cadence
  validate :classes_end_by_midnight
  validate :players_within_limit
  validate :players_of_the_coachs_club
  validate :owned_by_a_coach

  delegate :club, to: :coach

  # The dates of the generated Classes that would have overlapped another
  # Class of the Coach or of a Player, after a refused #create_with_plan.
  attr_reader :clashing_dates

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

    planned = generate_plan
    return false unless planned

    transaction do
      ClassClash.lock(coach: coach, players: players)
      @clashing_dates = ClassClash.new(coach: coach, players: players).dates(planned)
      if @clashing_dates.any?
        errors.add(:base, :clash)
        raise ActiveRecord::Rollback
      end

      save!
      planned.each do |planned_class|
        training_classes.create!(date: planned_class.date, start_time: start_time,
                                 course_module: planned_class.course_module, kind: planned_class.type)
      end
    end

    persisted?
  rescue ActiveRecord::ActiveRecordError => error
    Rails.logger.error("Class Group not saved: #{error.class}: #{error.message}")
    errors.add(:base, :not_saved)
    false
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

  # The group as the Class Group lists show it.
  def list_json
    common_json.merge(playerCount: players.size)
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
      coach: coach.name
    }
  end

  def generate_plan
    TrainingPlanGenerator.call(
      modules: CourseModule.teaching_for(level),
      cadence: cadence, weekdays: weekdays.map(&:to_sym), start_time: start_time,
      duration: duration, start_date: starts_on, break_periods: club.break_period_ranges
    )
  rescue TrainingPlanGenerator::NoTeachingModules
    errors.add(:level, :no_modules)
    nil
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
end
