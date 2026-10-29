# A Module's set of multiple-choice questions, in Portuguese and English.
# A Quiz with no questions counts as no Quiz (see CourseModule#quiz?).
class Quiz < ApplicationRecord
  belongs_to :course_module

  has_many :questions, -> { order(:position) }, class_name: "QuizQuestion", dependent: :destroy, inverse_of: :quiz
  accepts_nested_attributes_for :questions, allow_destroy: true
  has_many :attempts, class_name: "QuizAttempt", dependent: :destroy

  validates :course_module_id, uniqueness: true

  # Every question answered correctly, as a Quiz Attempt's answers. The seeds
  # and the demo Club use it to give a Client a Quiz Pass.
  def correct_answers
    questions.to_h { |q| [ q.id, q.correct_index ] }
  end

  # The questions as the import and the docs/questions JSON describe them.
  def question_rows
    questions.map(&:row)
  end

  # Replaces the questions with `rows` (as from docs/questions/<slug>.json),
  # unless they already match. Returns whether anything changed.
  def replace_questions!(rows)
    return false if persisted? && question_rows == rows

    transaction do
      save! if new_record?
      questions.destroy_all
      rows.each_with_index { |row, i| questions.create!(row.merge(position: i + 1)) }
    end
    true
  end
end
