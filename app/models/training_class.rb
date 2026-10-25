# A Class: one dated day of a Class Group's Training Plan, with a start time
# and a Module. Named TrainingClass because Ruby already defines Class; see
# docs/adr/0001-class-is-stored-as-training-class.md. It has no duration of
# its own: it lasts as long as its group's Classes.
class TrainingClass < ApplicationRecord
  belongs_to :class_group
  belongs_to :course_module

  # An Assessment Class is the last Class of each Module.
  enum :kind, { regular: 0, assessment: 1 }, validate: true

  validates :date, :start_time, presence: true

  delegate :duration, to: :class_group

  # The Class as the group's plan lists it.
  def plan_json
    {
      id: id,
      date: date.iso8601,
      startTime: start_time.strftime("%H:%M"),
      kind: kind,
      done: done,
      module: { id: course_module.slug, n: course_module.position, title: course_module.title }
    }
  end
end
