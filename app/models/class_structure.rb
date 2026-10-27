# How a Class is spent, by its duration, as the academy's methodology sets it:
# a warm-up, the Exercises the Coach picks (8 minutes each), a game based on
# the exercises (`conditioning`), and a game for the remaining time. The duration only changes this,
# never the weeks per Module, which follow the cadence (TrainingPlanGenerator).
class ClassStructure
  EXERCISE_MINUTES = 8

  # Minutes as ranges; the game takes whatever time is left.
  BY_DURATION = {
    60 => { warm_up: 5..5, exercises: 4, conditioning: 10..15 },
    90 => { warm_up: 10..15, exercises: 5, conditioning: 20..25 }
  }.freeze

  # How many Exercises a Class of `duration` minutes has.
  def self.exercises_for(duration)
    BY_DURATION.fetch(duration)[:exercises]
  end

  # The structure as the Class page shows it.
  def self.json_for(duration)
    parts = BY_DURATION.fetch(duration)
    {
      warmUp: range_json(parts[:warm_up]),
      exercises: { count: parts[:exercises], minutes: EXERCISE_MINUTES },
      conditioning: range_json(parts[:conditioning])
    }
  end

  def self.range_json(range)
    { min: range.first, max: range.last }
  end
  private_class_method :range_json
end
