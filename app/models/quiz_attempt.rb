# One submission of a Module's Quiz by a Client, with its score: the
# percentage of questions answered correctly, rounded down. A score of 80 or
# more is a Quiz Pass, which later attempts and Quiz edits never take away.
#
# `answers` maps each question's id to the index of the option chosen. Every
# question has to be answered; the score is worked out on create and frozen.
class QuizAttempt < ApplicationRecord
  PASS_SCORE = 80

  belongs_to :user
  belongs_to :quiz

  validate :every_question_answered, on: :create
  before_create :score_answers

  scope :passing, -> { where(score: PASS_SCORE..) }

  def passed?
    score >= PASS_SCORE
  end

  # The questions answered wrongly, by id, against the Quiz as it is now.
  def wrong_question_ids
    quiz.questions.reject { |q| answers[q.id] == q.correct_index }.map(&:id)
  end

  def correct_count
    quiz.questions.size - wrong_question_ids.size
  end

  # The result shown on the Quiz page straight after submitting: the answers
  # given and which were wrong, never the correct ones.
  def result_json
    {
      score: score,
      passed: passed?,
      correct: correct_count,
      total: quiz.questions.size,
      answers: answers,
      wrongQuestionIds: wrong_question_ids
    }
  end

  private

  def every_question_answered
    questions = quiz&.questions.to_a
    return errors.add(:quiz, "has no questions") if questions.empty?

    self.answers = answers.to_h.transform_keys(&:to_s).transform_values { |v| Integer(v, exception: false) }
    complete = questions.all? { |q| answers[q.id]&.between?(0, q.options_pt.size - 1) }
    errors.add(:answers, "must answer every question") unless complete && answers.size == questions.size
  end

  def score_answers
    self.score = correct_count * 100 / quiz.questions.size
  end
end
