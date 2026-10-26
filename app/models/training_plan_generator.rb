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
# A Module spans 6 weeks of 60-minute Classes or 4 weeks of 90-minute ones,
# whatever the cadence, which only sets how many Classes fall in each week
# (docs/adr/0008). Only a Module's last Class is its Assessment Class, and a
# partial first week counts as a full week (docs/adr/0002).
#
# Regenerating a plan continues the Course rather than restarting it
# (docs/adr/0005): the caller passes only the Modules not yet complete, and
# how many Classes of the first of them are already done. Those count toward
# that Module, so only its remaining Classes are generated, counted in
# Classes rather than weeks, still ending with its Assessment Class. Later
# Modules start in the next open week and are generated in full.
class TrainingPlanGenerator
  # Weeks per Module, by Class duration in minutes.
  WEEKS_PER_MODULE = { 60 => 6, 90 => 4 }.freeze
  DURATIONS = WEEKS_PER_MODULE.keys.freeze
  CADENCES = [1, 2].freeze
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
  # done_in_first_module: Classes of the first Module already done, when
  #                       regenerating a plan
  def initialize(modules:, cadence:, weekdays:, start_time:, duration:, start_date:, break_periods: [],
                 done_in_first_module: 0)
    @modules = Array(modules)
    @cadence = cadence
    @weekdays = weekdays
    @start_time = start_time
    @duration = duration
    @start_date = start_date
    @break_periods = break_periods
    @done_in_first_module = done_in_first_module

    validate!
  end

  def call
    weeks = each_open_week
    first, *rest = @modules
    first_classes = if @done_in_first_module.zero?
                      module_classes(first, weeks)
                    else
                      remaining_module_classes(first, weeks)
                    end
    first_classes + rest.flat_map { |course_module| module_classes(course_module, weeks) }
  end

  private

  def validate!
    raise NoTeachingModules if @modules.empty?
    raise ArgumentError, "cadence must be 1 or 2" unless CADENCES.include?(@cadence)
    raise ArgumentError, "duration must be 60 or 90" unless DURATIONS.include?(@duration)
    raise ArgumentError, "start_date is required" unless @start_date.respond_to?(:cwday)
    unless @done_in_first_module.is_a?(Integer) && @done_in_first_module >= 0
      raise ArgumentError, "done_in_first_module must be a count of Classes"
    end
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

  # The Classes of a Module already started: its full count of Classes less
  # those done, and always at least its Assessment Class. A week left part
  # used is not used by the next Module.
  def remaining_module_classes(course_module, weeks)
    total = weeks_per_module * @cadence
    remaining = [total - @done_in_first_module, 1].max
    dates = []
    dates.concat(weeks.next) while dates.size < remaining
    dates.first(remaining).each_with_index.map do |date, index|
      planned(date, course_module, index == remaining - 1 ? :assessment : :regular)
    end
  end

  def weeks_per_module
    WEEKS_PER_MODULE.fetch(@duration)
  end

  def planned(date, course_module, type)
    PlannedClass.new(date: date, start_time: @start_time, duration: @duration, course_module: course_module, type: type)
  end

  def module_classes(course_module, weeks)
    week_count = weeks_per_module
    dates = Array.new(week_count) { weeks.next }
    dates.each_with_index.map do |week, index|
      week.each_with_index.map do |date, in_week|
        assessment = index == week_count - 1 && in_week == week.size - 1
        planned(date, course_module, assessment ? :assessment : :regular)
      end
    end.flatten
  end
end
