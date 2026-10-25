# A Class: one dated day of a Class Group's Training Plan, with a start time
# and a Module. Named TrainingClass because Ruby already defines Class; see
# docs/adr/0001-class-is-stored-as-training-class.md. It has no duration of
# its own: it lasts as long as its group's Classes.
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

  delegate :duration, to: :class_group

  # The minutes of its day the Class runs.
  def interval
    ClassInterval.of(start_time, duration)
  end

  # Picks an Exercise for the Class, after those already picked. Returns the
  # pick, which is refused (unsaved, with errors) for an Exercise of another
  # Module or one already picked.
  def pick_exercise(exercise)
    pick = training_class_exercises.build(exercise: exercise,
                                          position: training_class_exercises.maximum(:position).to_i + 1)
    training_class_exercises.delete(pick) unless pick.save
    pick
  end

  # The Class as the group's plan lists it.
  def plan_json
    {
      id: id,
      date: date.iso8601,
      startTime: start_time.strftime("%H:%M"),
      kind: kind,
      done: done,
      module: { slug: course_module.slug, number: course_module.position, title: course_module.title },
      exercises: exercises.map { |exercise| { ref: exercise.ref, title: exercise.title } }
    }
  end
end
