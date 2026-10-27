# A Class: one dated day of a Class Group's Training Plan, with a start time
# and a Module. Named TrainingClass because Ruby already defines Class; see
# docs/adr/0001-class-is-stored-as-training-class.md. It has no duration of
# its own: it lasts as long as its group's Classes.
#
# The Coach edits a plan Class by Class: moving one, skipping it (it stays in
# the plan but no longer takes up its time), adding one of their own (marked
# coach_added) and marking one done. A Class is never both done and skipped;
# see docs/adr/0003-skipping-a-class.md.
class TrainingClass < ApplicationRecord
  belongs_to :class_group
  belongs_to :course_module
  # The Exercises the Coach picked, in the order picked. Never assigned
  # automatically.
  has_many :training_class_exercises, -> { order(:position) }, dependent: :delete_all, inverse_of: :training_class
  has_many :exercises, through: :training_class_exercises

  # An Assessment Class is the last Class of each Module.
  enum :kind, { regular: 0, assessment: 1 }, validate: true

  # A start time is a wall-clock time at the Club, never shifted by time zone.
  self.skip_time_zone_conversion_for_attributes = [:start_time]

  validates :date, :start_time, presence: true
  # Checked only when their inputs change, so older Classes saved before
  # these rules can still be skipped or marked done.
  validate :ends_by_midnight, if: -> { will_save_change_to_date? || will_save_change_to_start_time? }
  validate :module_of_the_groups_course, if: :will_save_change_to_course_module_id?
  validate :not_both_done_and_skipped

  delegate :duration, to: :class_group

  # The date this Class would have overlapped another Class of the Coach or of
  # a Player, after a refused #save_unless_clashing.
  attr_reader :clashing_dates

  # Saves a moved, added or unskipped Class, unless it is invalid or would
  # overlap in time with another Class of its group's Coach or of one of its
  # Players (the clashing date is then in #clashing_dates). A skipped Class
  # takes up no time, so it never clashes.
  def save_unless_clashing
    @clashing_dates = []
    return false unless valid?

    saved = false
    transaction do
      coach = class_group.coach
      players = class_group.players
      ClassClash.lock(coach: coach, players: players)
      @clashing_dates = skipped? ? [] : ClassClash.new(coach: coach, players: players).dates([self])
      if @clashing_dates.any?
        errors.add(:base, :clash)
        raise ActiveRecord::Rollback
      end

      saved = save!
    end
    saved
  end

  # The minutes of its day the Class runs.
  def interval
    ClassInterval.of(start_time, duration)
  end

  # Picks an Exercise for the Class, after those already picked. Returns the
  # pick, which is refused (unsaved, with errors) for an Exercise of another
  # Module or one already picked. The Class is locked meanwhile, so picks made
  # at the same time get distinct positions.
  def pick_exercise(exercise)
    with_lock do
      pick = training_class_exercises.build(exercise: exercise,
                                            position: training_class_exercises.maximum(:position).to_i + 1)
      training_class_exercises.delete(pick) unless pick.save
      pick
    end
  end

  # The Classes `coach` teaches on `date`, skipped ones left out, by start
  # time: the Coach home's "Today". Loaded with their group and Module in one
  # query, and the group's Players in one more, for #home_json.
  def self.taught_on(date, coach:)
    eager_load(:course_module, :class_group)
      .preload(class_group: :class_group_players)
      .where(date: date, skipped: false, class_groups: { coach_id: coach.id })
      .order(:start_time, :id)
  end

  # Each Class with its number in its group's plan, as plan_number: Class 1
  # is the first by date and start time, skipped ones included. Filters on
  # the result leave the numbers as they are.
  def self.numbered
    from(unscoped.select(<<~SQL.squish), :training_classes)
      training_classes.*,
      ROW_NUMBER() OVER (PARTITION BY class_group_id ORDER BY date, start_time, id) AS plan_number
    SQL
  end

  # The Classes of `coach`'s groups dated in `dates`, skipped ones left out,
  # by date and start time, numbered: the week on the Coach's Class Groups
  # page. Loaded with their group and Module.
  def self.week_of(coach:, dates:)
    numbered.joins(:class_group).where(class_groups: { coach_id: coach.id })
            .where(date: dates, skipped: false)
            .preload(:course_module, :class_group).order(:date, :start_time, :id)
  end

  # The Class as the Class Groups page's week shows it. Load it .week_of.
  def week_json
    {
      id: id,
      date: date.iso8601,
      startTime: start_time.strftime("%H:%M"),
      duration: duration,
      kind: kind,
      done: done,
      number: plan_number,
      moduleNumber: course_module.position,
      group: { id: class_group.id, name: class_group.name, level: class_group.level }
    }
  end

  # Its number in its group's plan (see .numbered), from the group's Classes.
  def number_in_plan
    class_group.training_classes.index(self) + 1
  end

  # The Class as the Coach home lists it, with its group. Load it .taught_on.
  def home_json
    {
      id: id,
      startTime: start_time.strftime("%H:%M"),
      duration: duration,
      kind: kind,
      done: done,
      module: module_json,
      group: { id: class_group.id, name: class_group.name, level: class_group.level,
               playerCount: class_group.class_group_players.size }
    }
  end

  # The Class as the group's plan lists it, with its `number` in the plan
  # and its Module's topics.
  def plan_json(number: nil)
    {
      id: id,
      number: number,
      date: date.iso8601,
      startTime: start_time.strftime("%H:%M"),
      kind: kind,
      done: done,
      skipped: skipped,
      coachAdded: coach_added,
      module: module_json.merge(topics: course_module.topics),
      exercises: exercises.map { |exercise| { ref: exercise.ref, title: exercise.title } }
    }
  end

  # The Class as its own page shows it: as the plan lists it, with its
  # Module's description too.
  def page_json
    json = plan_json(number: number_in_plan)
    json.merge(module: json[:module].merge(description: course_module.description))
  end

  private

  def module_json
    { slug: course_module.slug, number: course_module.position, title: course_module.title }
  end

  # A Class ends on its own day, so the clash rule compares same-date Classes.
  def ends_by_midnight
    return unless start_time && class_group

    errors.add(:start_time, :crosses_midnight) if interval.crosses_midnight?
  end

  def module_of_the_groups_course
    return unless course_module && class_group

    errors.add(:course_module, :other_course) unless class_group.course_modules.include?(course_module)
  end

  # Marking a skipped Class done, or skipping a done one, is refused.
  def not_both_done_and_skipped
    return unless done? && skipped?

    if will_save_change_to_skipped?
      errors.add(:skipped, :done)
    else
      errors.add(:done, :skipped)
    end
  end
end
