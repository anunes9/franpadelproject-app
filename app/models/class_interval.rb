# The minutes of its day a Class runs, from its start (inclusive) to its end
# (exclusive): 18:00 for 90 minutes is 1080 to 1170. Start times are
# wall-clock times at the Club, so no time zone applies.
class ClassInterval < Data.define(:start_minute, :end_minute)
  MINUTES_PER_DAY = 24 * 60

  def self.of(start_time, duration)
    time = ActiveModel::Type::Time.new.cast(start_time)
    start = (time.hour * 60) + time.min
    new(start_minute: start, end_minute: start + duration)
  end

  # Back-to-back Classes (one ends when the other starts) do not overlap.
  def overlaps?(other)
    start_minute < other.end_minute && other.start_minute < end_minute
  end

  # Whether the Class would end after midnight, on the next day.
  def crosses_midnight?
    end_minute > MINUTES_PER_DAY
  end
end
