# Generates a Class Group's Training Plan: the dated Classes for a whole
# Course, by rules alone. Pure -- no database writes, no clock, no AI -- so
# the caller supplies the Break Periods and persists the result.
#
#   TrainingPlanGenerator.call(
#     modules: CourseModule.teaching_for(:beginner),
#     cadence: 2, weekdays: %i[monday thursday], start_time: "18:00",
#     duration: 90, start_date: Date.new(2026, 9, 7),
#     break_periods: [Date.new(2026, 12, 21)..Date.new(2027, 1, 3)]
#   ) # => [TrainingPlanGenerator::PlannedClass, ...]
#
# Weeks are calendar weeks (Monday to Sunday). A week that overlaps a Break
# Period at all gets no Classes and does not count toward a Module's weeks.
class TrainingPlanGenerator
  CADENCE_WEEKS_PER_MODULE = { 1 => 6, 2 => 4 }.freeze
  DURATIONS = [60, 90].freeze
  WEEKDAYS = %i[monday tuesday wednesday thursday friday saturday sunday].freeze

  class NoTeachingModules < StandardError
    def initialize(msg = "The Course has no teaching Modules, so no Training Plan can be generated")
      super
    end
  end

  # type is :regular or :assessment. Exercises are not part of generation.
  PlannedClass = Data.define(:date, :start_time, :duration, :course_module, :type) do
    # The minutes of its day the Class runs, as TrainingClass#interval.
    def interval
      ClassInterval.of(start_time, duration)
    end
  end

  def self.call(...)
    new(...).call
  end

  # modules:       the Course's teaching Modules in order
  # cadence:       1 or 2 Classes a week
  # weekdays:      one per weekly Class, as symbols (:monday..:sunday)
  # start_time:    passed through to every Class
  # duration:      60 or 90 minutes
  # start_date:    the first Class is on the first chosen weekday on or after it
  # break_periods: date ranges (inclusive) in which no Classes are generated
  def initialize(modules:, cadence:, weekdays:, start_time:, duration:, start_date:, break_periods: [])
    @modules = Array(modules)
    @cadence = cadence
    @weekdays = weekdays
    @start_time = start_time
    @duration = duration
    @start_date = start_date
    @break_periods = break_periods

    validate!
  end

  def call
    weeks = each_open_week
    @modules.flat_map { |course_module| module_classes(course_module, weeks) }
  end

  private

  def validate!
    raise NoTeachingModules if @modules.empty?
    raise ArgumentError, "cadence must be 1 or 2" unless CADENCE_WEEKS_PER_MODULE.key?(@cadence)
    raise ArgumentError, "duration must be 60 or 90" unless DURATIONS.include?(@duration)
    raise ArgumentError, "start_date is required" unless @start_date.respond_to?(:cwday)
    unless @weekdays.size == @cadence && @weekdays.uniq.size == @cadence && (@weekdays - WEEKDAYS).empty?
      raise ArgumentError, "weekdays must be #{@cadence} distinct weekday(s) from #{WEEKDAYS.join(', ')}"
    end
  end

  # Endless sequence of weeks that have Classes, each as its sorted dates.
  # Lazy so the caller takes only as many as the Modules need.
  def each_open_week
    offsets = @weekdays.map { |day| WEEKDAYS.index(day) }.sort
    first_monday = @start_date.beginning_of_week(:monday)

    Enumerator.new do |yielder|
      monday = first_monday
      loop do
        dates = offsets.map { |offset| monday + offset }.select { |date| date >= @start_date }
        yielder << dates unless dates.empty? || on_break?(monday)
        monday += 7
      end
    end
  end

  def on_break?(monday)
    sunday = monday + 6
    @break_periods.any? { |period| period.first <= sunday && period.last >= monday }
  end

  def module_classes(course_module, weeks)
    week_count = CADENCE_WEEKS_PER_MODULE.fetch(@cadence)
    dates = Array.new(week_count) { weeks.next }
    dates.each_with_index.map do |week, index|
      week.each_with_index.map do |date, in_week|
        assessment = index == week_count - 1 && in_week == week.size - 1
        PlannedClass.new(date: date, start_time: @start_time, duration: @duration,
                         course_module: course_module, type: assessment ? :assessment : :regular)
      end
    end.flatten
  end
end
