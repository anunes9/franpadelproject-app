# A Class: one dated day of a Class Group's Training Plan, with a start time
# and a Module. Named TrainingClass because Ruby already defines Class; see
# docs/adr/0001-class-is-stored-as-training-class.md. It has no duration of
# its own: it lasts as long as its group's Classes.
class TrainingClass < ApplicationRecord
  belongs_to :class_group
  belongs_to :course_module

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

  # The Class as the group's plan lists it.
  def plan_json
    {
      id: id,
      date: date.iso8601,
      startTime: start_time.strftime("%H:%M"),
      kind: kind,
      done: done,
      module: { slug: course_module.slug, number: course_module.position, title: course_module.title }
    }
  end
end
